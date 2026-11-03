// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IPriceFeed {
    function fetchPrice() external view returns (uint256);
}

interface IBorrowerOperations {
    function openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint) external payable;
    function adjustTrove(
        uint256 _collWithdrawal,
        uint256 _debtChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable;
    function closeTrove() external;
    function addColl(address _upperHint, address _lowerHint) external payable;
    function repayMUSD(uint256 _amount, address _upperHint, address _lowerHint) external;
}

interface ITroveManager {
    function getTroveStatus(address _borrower) external view returns (uint256);
    function getTroveDebt(address _borrower) external view returns (uint256);
    function getTroveColl(address _borrower) external view returns (uint256);
    function getCurrentICR(address _borrower, uint256 _price) external view returns (uint256);
}

interface IHintHelpers {
    function getApproxHint(uint256 _CR, uint256 _numTrials, uint256 _inputRandomSeed)
        external
        view
        returns (address hintAddress, uint256 diff, uint256 latestRandomSeed);
}

interface ISortedTroves {
    function findInsertPosition(uint256 _ICR, address _prevId, address _nextId)
        external
        view
        returns (address, address);
}

interface IPayrollStreamer {
    function emergencyReclaimForDebt(uint256 streamId, uint256 maxAmount) external returns (uint256);
    function getUnvestedBuffer(uint256 streamId) external view returns (uint256);
}

interface IMezoStakingBoost {
    function getFeeDiscountBps(address user) external view returns (uint256);
    function getKeeperBonusBoostBps(address user) external view returns (uint256);
    function depositProtocolRevenue(uint256 amount) external;
}

/**
 * @title MezoFlowVault
 * @notice Protocol-aware Bitcoin collateral vault integrated with Mezo's native BorrowerOperations and PriceFeed.
 * Supports explicit separation of native BTC and tBTC collateral, dynamic oracle pricing, keeper liquidations,
 * closed-loop Self-Healing Trove automated debt amortization, and MEZO staking fee discounts.
 */
contract MezoFlowVault {
    address public owner;
    address public immutable tbtcToken;
    address public immutable musdToken;

    // Mezo protocol integration contracts
    address public priceFeed;
    address public borrowerOperations;
    address public troveManager;
    address public hintHelpers;
    address public sortedTroves;

    // Wave 2 additions: PayrollStreamer integration & Auto-Heal thresholds
    address public payrollStreamer;
    uint256 public constant AUTO_HEAL_ICR_THRESHOLD = 135e16; // 135% ICR trigger
    uint256 public constant TARGET_HEALTHY_ICR = 170e16; // 170% target healthy ICR

    // Wave 2 additions: MEZO Governance Staking Boost
    address public mezoStakingBoost;
    uint256 public baseBorrowingFeeBps = 0; // Configurable base borrow fee (e.g. 50 bps = 0.50%)

    uint256 public constant MAX_LTV_BPS = 6000; // 60% Max Borrow LTV
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 7500; // 75% Liquidation LTV
    uint256 public constant LIQUIDATION_BONUS_BPS = 500; // 5% keeper incentive
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public fallbackPrice = 60000 * 1e18; // Fallback if oracle is unavailable

    // Collateral accounting separation
    mapping(address => uint256) public tbtcCollateralBalances;
    mapping(address => uint256) public nativeCollateralBalances;
    mapping(address => uint256) public borrowedMUSD;

    bool private locked;

    event CollateralDeposited(address indexed user, uint256 amount, bool isNative);
    event CollateralWithdrawn(address indexed user, uint256 amount, bool isNative);
    event MUSDBorrowed(address indexed user, uint256 amount);
    event MUSARepaid(address indexed user, uint256 amount);
    event PositionLiquidated(
        address indexed user,
        address indexed liquidator,
        uint256 debtRepaid,
        uint256 collateralSeized,
        bool isNative
    );
    event MezoTroveOpened(uint256 btcCollateral, uint256 musdAmount);
    event MezoTroveAdjusted(uint256 collAdded, uint256 debtRepaid);
    event PriceFeedUpdated(address newPriceFeed);
    event PayrollStreamerUpdated(address newStreamer);
    event MezoStakingBoostUpdated(address indexed newBoost);
    event BaseBorrowingFeeUpdated(uint256 newFeeBps);
    event TroveAutoHealed(
        address indexed employer,
        uint256 indexed streamId,
        uint256 musdRepaid,
        uint256 preICR,
        uint256 postICR
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy guard");
        locked = true;
        _;
        locked = false;
    }

    constructor(
        address _tbtc,
        address _musd,
        address _priceFeed,
        address _borrowerOperations,
        address _troveManager,
        address _hintHelpers,
        address _sortedTroves
    ) {
        owner = msg.sender;
        tbtcToken = _tbtc;
        musdToken = _musd;
        priceFeed = _priceFeed;
        borrowerOperations = _borrowerOperations;
        troveManager = _troveManager;
        hintHelpers = _hintHelpers;
        sortedTroves = _sortedTroves;
    }

    function setPayrollStreamer(address _streamer) external onlyOwner {
        payrollStreamer = _streamer;
        emit PayrollStreamerUpdated(_streamer);
    }

    function setMezoStakingBoost(address _boost) external onlyOwner {
        mezoStakingBoost = _boost;
        emit MezoStakingBoostUpdated(_boost);
    }

    function setBaseBorrowingFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Max fee is 5%");
        baseBorrowingFeeBps = _feeBps;
        emit BaseBorrowingFeeUpdated(_feeBps);
    }

    // --- Price Oracle Logic ---

    function getBTCPrice() public view returns (uint256) {
        if (priceFeed != address(0)) {
            try IPriceFeed(priceFeed).fetchPrice() returns (uint256 livePrice) {
                if (livePrice > 0) {
                    return livePrice;
                }
            } catch {}
        }
        return fallbackPrice;
    }

    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = _priceFeed;
        emit PriceFeedUpdated(_priceFeed);
    }

    function setFallbackPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "Price must be > 0");
        fallbackPrice = _price;
    }

    function setMezoProtocol(
        address _borrowerOperations,
        address _troveManager,
        address _hintHelpers,
        address _sortedTroves
    ) external onlyOwner {
        borrowerOperations = _borrowerOperations;
        troveManager = _troveManager;
        hintHelpers = _hintHelpers;
        sortedTroves = _sortedTroves;
    }

    // --- User Collateral Views ---

    function collateralBalances(address user) external view returns (uint256) {
        return tbtcCollateralBalances[user] + nativeCollateralBalances[user];
    }

    function getCollateralValueUSD(address user) public view returns (uint256) {
        uint256 totalCollateral = tbtcCollateralBalances[user] + nativeCollateralBalances[user];
        return (totalCollateral * getBTCPrice()) / 1e18;
    }

    function getMaxBorrow(address user) public view returns (uint256) {
        return (getCollateralValueUSD(user) * MAX_LTV_BPS) / BPS_DENOMINATOR;
    }

    function getHealthFactor(address user) public view returns (uint256) {
        uint256 debt = borrowedMUSD[user];
        if (debt == 0) return type(uint256).max;
        return (getCollateralValueUSD(user) * 1e18) / debt;
    }

    function isLiquidatable(address user) public view returns (bool) {
        uint256 debt = borrowedMUSD[user];
        if (debt == 0) return false;
        uint256 maxAllowedDebt = (getCollateralValueUSD(user) * LIQUIDATION_THRESHOLD_BPS) / BPS_DENOMINATOR;
        return debt > maxAllowedDebt;
    }

    // --- Wave 2: Self-Healing Trove View & Calculation Logic ---

    function isAutoHealEligible(address employer) public view returns (bool eligible, uint256 currentICR) {
        // 1. Check external Mezo Trove if configured
        if (troveManager != address(0)) {
            uint256 status = ITroveManager(troveManager).getTroveStatus(employer);
            if (status == 1) { // 1 = Active Trove
                currentICR = ITroveManager(troveManager).getCurrentICR(employer, getBTCPrice());
                if (currentICR > 0 && currentICR < AUTO_HEAL_ICR_THRESHOLD) {
                    return (true, currentICR);
                }
            }
        }

        // 2. Check internal vault debt position
        uint256 debt = borrowedMUSD[employer];
        if (debt > 0) {
            uint256 collValue = getCollateralValueUSD(employer);
            if (collValue > 0) {
                currentICR = (collValue * 1e18) / debt;
            } else {
                currentICR = 0;
            }
            if (currentICR < AUTO_HEAL_ICR_THRESHOLD || isLiquidatable(employer)) {
                return (true, currentICR);
            }
        }

        return (false, currentICR);
    }

    function calculateDebtToRestoreICR(address employer, uint256 targetICR) public view returns (uint256) {
        require(targetICR > 0, "Target ICR must be > 0");
        uint256 collValueUSD = getCollateralValueUSD(employer);
        if (collValueUSD == 0) return borrowedMUSD[employer];

        // Max debt allowed at target ICR: TargetMaxDebt = (CollValueUSD * 1e18) / targetICR
        uint256 targetMaxDebt = (collValueUSD * 1e18) / targetICR;
        uint256 currentDebt = borrowedMUSD[employer];

        if (currentDebt > targetMaxDebt) {
            return currentDebt - targetMaxDebt;
        }
        return 0;
    }

    // --- Deposit & Withdraw Logic ---

    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        tbtcCollateralBalances[msg.sender] += amount;
        bool success = IERC20(tbtcToken).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");
        emit CollateralDeposited(msg.sender, amount, false);
    }

    function depositNativeCollateral() external payable nonReentrant {
        require(msg.value > 0, "Amount must be > 0");
        nativeCollateralBalances[msg.sender] += msg.value;
        emit CollateralDeposited(msg.sender, msg.value, true);
    }

    receive() external payable {
        if (msg.value > 0) {
            nativeCollateralBalances[msg.sender] += msg.value;
            emit CollateralDeposited(msg.sender, msg.value, true);
        }
    }

    function withdrawCollateral(uint256 amount, bool isNative) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        if (isNative) {
            require(nativeCollateralBalances[msg.sender] >= amount, "Insufficient native collateral");
        } else {
            require(tbtcCollateralBalances[msg.sender] >= amount, "Insufficient tBTC collateral");
        }

        uint256 totalCollateral = tbtcCollateralBalances[msg.sender] + nativeCollateralBalances[msg.sender];
        require(totalCollateral >= amount, "Insufficient collateral");
        uint256 remainingCollateral = totalCollateral - amount;
        uint256 collateralValueUSD = (remainingCollateral * getBTCPrice()) / 1e18;
        uint256 maxBorrow = (collateralValueUSD * MAX_LTV_BPS) / BPS_DENOMINATOR;
        require(borrowedMUSD[msg.sender] <= maxBorrow, "Position would be undercollateralized");

        if (isNative) {
            nativeCollateralBalances[msg.sender] -= amount;
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            tbtcCollateralBalances[msg.sender] -= amount;
            bool success = IERC20(tbtcToken).transfer(msg.sender, amount);
            require(success, "Transfer failed");
        }
        emit CollateralWithdrawn(msg.sender, amount, isNative);
    }

    // --- Borrow & Repay Logic ---

    function borrowMUSD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        uint256 maxBorrow = getMaxBorrow(msg.sender);
        require(borrowedMUSD[msg.sender] + amount <= maxBorrow, "Exceeds max LTV");

        uint256 fee = 0;
        if (baseBorrowingFeeBps > 0) {
            uint256 discountBps = 0;
            if (mezoStakingBoost != address(0)) {
                discountBps = IMezoStakingBoost(mezoStakingBoost).getFeeDiscountBps(msg.sender);
            }
            uint256 effectiveFeeBps = (baseBorrowingFeeBps * (BPS_DENOMINATOR - discountBps)) / BPS_DENOMINATOR;
            fee = (amount * effectiveFeeBps) / BPS_DENOMINATOR;
        }

        uint256 netAmount = amount - fee;
        borrowedMUSD[msg.sender] += amount;

        bool success = IERC20(musdToken).transfer(msg.sender, netAmount);
        require(success, "Transfer failed");

        if (fee > 0 && mezoStakingBoost != address(0)) {
            IERC20(musdToken).approve(mezoStakingBoost, fee);
            IMezoStakingBoost(mezoStakingBoost).depositProtocolRevenue(fee);
        }

        emit MUSDBorrowed(msg.sender, amount);
    }

    function repayMUSD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(borrowedMUSD[msg.sender] >= amount, "Amount exceeds debt");
        borrowedMUSD[msg.sender] -= amount;
        bool success = IERC20(musdToken).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");
        emit MUSARepaid(msg.sender, amount);
    }

    function repayMUSDFor(address user, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(borrowedMUSD[user] >= amount, "Amount exceeds debt");
        borrowedMUSD[user] -= amount;
        bool success = IERC20(musdToken).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");
        emit MUSARepaid(user, amount);
    }

    // --- Liquidation Mechanism ---

    function liquidate(address user, uint256 debtToRepay, bool seizeNative) external nonReentrant {
        require(user != msg.sender, "Cannot liquidate self");
        require(debtToRepay > 0, "Debt to repay must be > 0");
        require(borrowedMUSD[user] >= debtToRepay, "Exceeds user debt");
        require(isLiquidatable(user), "Position not liquidatable");

        uint256 btcPrice = getBTCPrice();
        uint256 keeperBonusBps = LIQUIDATION_BONUS_BPS;
        if (mezoStakingBoost != address(0)) {
            keeperBonusBps += IMezoStakingBoost(mezoStakingBoost).getKeeperBonusBoostBps(msg.sender);
        }
        uint256 collateralValueWithBonus = (debtToRepay * (BPS_DENOMINATOR + keeperBonusBps)) / BPS_DENOMINATOR;
        uint256 collateralSeized = (collateralValueWithBonus * 1e18) / btcPrice;

        if (seizeNative) {
            if (collateralSeized > nativeCollateralBalances[user]) {
                collateralSeized = nativeCollateralBalances[user];
            }
            nativeCollateralBalances[user] -= collateralSeized;
        } else {
            if (collateralSeized > tbtcCollateralBalances[user]) {
                collateralSeized = tbtcCollateralBalances[user];
            }
            tbtcCollateralBalances[user] -= collateralSeized;
        }

        borrowedMUSD[user] -= debtToRepay;

        bool musdReceived = IERC20(musdToken).transferFrom(msg.sender, address(this), debtToRepay);
        require(musdReceived, "MUSD transfer failed");

        if (seizeNative) {
            (bool sent, ) = payable(msg.sender).call{value: collateralSeized}("");
            require(sent, "Native transfer failed");
        } else {
            bool transferred = IERC20(tbtcToken).transfer(msg.sender, collateralSeized);
            require(transferred, "tBTC transfer failed");
        }

        emit PositionLiquidated(user, msg.sender, debtToRepay, collateralSeized, seizeNative);
    }

    // --- Wave 2: Closed-Loop Self-Healing Trove Execution ---

    function autoHealTrove(address employer, uint256 streamId) external nonReentrant {
        require(payrollStreamer != address(0), "PayrollStreamer not configured");
        (bool eligible, uint256 preICR) = isAutoHealEligible(employer);
        require(eligible, "Trove is healthy or not eligible for auto-heal");

        uint256 debtToRepay = calculateDebtToRestoreICR(employer, TARGET_HEALTHY_ICR);
        if (debtToRepay == 0) {
            debtToRepay = borrowedMUSD[employer] > 0 ? (borrowedMUSD[employer] / 4) + 1 : 500 ether;
        }

        // Reclaim emergency buffer from unvested payroll stream
        uint256 reclaimed = IPayrollStreamer(payrollStreamer).emergencyReclaimForDebt(streamId, debtToRepay);
        require(reclaimed > 0, "No unvested buffer reclaimed");

        // Repay internal vault debt
        if (borrowedMUSD[employer] > 0) {
            uint256 internalRepay = reclaimed < borrowedMUSD[employer] ? reclaimed : borrowedMUSD[employer];
            borrowedMUSD[employer] -= internalRepay;
            emit MUSARepaid(employer, internalRepay);
            reclaimed -= internalRepay;
        }

        // Repay external Mezo Trove if remaining and Trove exists
        if (reclaimed > 0 && borrowerOperations != address(0)) {
            IERC20(musdToken).approve(borrowerOperations, reclaimed);
            (address upper, address lower) = _getCurrentMezoHints();
            IBorrowerOperations(borrowerOperations).repayMUSD(reclaimed, upper, lower);
            emit MezoTroveAdjusted(0, reclaimed);
        }

        (, uint256 postICR) = isAutoHealEligible(employer);
        emit TroveAutoHealed(employer, streamId, debtToRepay, preICR, postICR);
    }

    // --- Mezo Protocol BorrowerOperations Trove Composition ---

    function openMezoTrove(uint256 musdAmount) external payable onlyOwner nonReentrant {
        require(borrowerOperations != address(0), "BorrowerOperations not configured");
        require(msg.value > 0, "No collateral provided");
        require(musdAmount >= 1800e18, "Min debt is 1800 MUSD");

        (address upper, address lower) = _getMezoHints(musdAmount, msg.value);
        IBorrowerOperations(borrowerOperations).openTrove{value: msg.value}(musdAmount, upper, lower);
        emit MezoTroveOpened(msg.value, musdAmount);
    }

    function addCollateralToMezoTrove() external payable onlyOwner nonReentrant {
        require(borrowerOperations != address(0), "BorrowerOperations not configured");
        require(msg.value > 0, "No collateral provided");

        (address upper, address lower) = _getCurrentMezoHints();
        IBorrowerOperations(borrowerOperations).addColl{value: msg.value}(upper, lower);
        emit MezoTroveAdjusted(msg.value, 0);
    }

    function repayMezoTroveDebt(uint256 amount) external onlyOwner nonReentrant {
        require(borrowerOperations != address(0), "BorrowerOperations not configured");
        require(amount > 0, "Amount must be > 0");

        IERC20(musdToken).approve(borrowerOperations, amount);
        (address upper, address lower) = _getCurrentMezoHints();
        IBorrowerOperations(borrowerOperations).repayMUSD(amount, upper, lower);
        emit MezoTroveAdjusted(0, amount);
    }

    function getMezoTroveInfo() external view returns (uint256 status, uint256 debt, uint256 coll, uint256 icr) {
        if (troveManager == address(0)) return (0, 0, 0, 0);
        status = ITroveManager(troveManager).getTroveStatus(address(this));
        debt = ITroveManager(troveManager).getTroveDebt(address(this));
        coll = ITroveManager(troveManager).getTroveColl(address(this));
        icr = ITroveManager(troveManager).getCurrentICR(address(this), getBTCPrice());
    }

    function _getMezoHints(uint256 _debt, uint256 _coll) internal view returns (address upper, address lower) {
        if (hintHelpers == address(0) || sortedTroves == address(0)) {
            return (address(0), address(0));
        }
        uint256 price = getBTCPrice();
        uint256 icr = (_coll * price) / _debt;
        (address approxHint,,) = IHintHelpers(hintHelpers).getApproxHint(icr, 10, 42);
        (upper, lower) = ISortedTroves(sortedTroves).findInsertPosition(icr, approxHint, approxHint);
    }

    function _getCurrentMezoHints() internal view returns (address upper, address lower) {
        if (hintHelpers == address(0) || sortedTroves == address(0) || troveManager == address(0)) {
            return (address(0), address(0));
        }
        uint256 icr = ITroveManager(troveManager).getCurrentICR(address(this), getBTCPrice());
        (address approxHint,,) = IHintHelpers(hintHelpers).getApproxHint(icr, 10, 42);
        (upper, lower) = ISortedTroves(sortedTroves).findInsertPosition(icr, approxHint, approxHint);
    }
}
