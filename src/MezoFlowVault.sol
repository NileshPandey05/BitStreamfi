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

/**
 * @title MezoFlowVault
 * @notice Protocol-aware Bitcoin collateral vault integrated with Mezo's native BorrowerOperations and PriceFeed.
 * Supports explicit separation of native BTC and tBTC ERC-20 collateral, dynamic oracle pricing, and keeper liquidations.
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

    uint256 public constant MAX_LTV_BPS = 6000; // 60% Max Borrow LTV
    uint256 public constant LIQUIDATION_THRESHOLD_BPS = 7500; // 75% Liquidation LTV
    uint256 public constant LIQUIDATION_BONUS_BPS = 500; // 5% keeper incentive
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public fallbackPrice = 60000 * 1e18; // Fallback if oracle is unavailable

    // High Severity Fix 1: Separate native collateral and tBTC collateral accounting
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

        borrowedMUSD[msg.sender] += amount;
        bool success = IERC20(musdToken).transfer(msg.sender, amount);
        require(success, "Transfer failed");
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

    // --- High Severity Fix 3: Liquidation Mechanism ---

    function liquidate(address user, uint256 debtToRepay, bool seizeNative) external nonReentrant {
        require(user != msg.sender, "Cannot liquidate self");
        require(debtToRepay > 0, "Debt to repay must be > 0");
        require(borrowedMUSD[user] >= debtToRepay, "Exceeds user debt");
        require(isLiquidatable(user), "Position not liquidatable");

        uint256 btcPrice = getBTCPrice();
        // Seize collateral with 5% bonus: collateralSeized = (debtToRepay * 10500 / 10000 * 1e18) / btcPrice
        uint256 collateralValueWithBonus = (debtToRepay * (BPS_DENOMINATOR + LIQUIDATION_BONUS_BPS)) / BPS_DENOMINATOR;
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

        // Liquidator repays user debt in MUSD
        bool musdReceived = IERC20(musdToken).transferFrom(msg.sender, address(this), debtToRepay);
        require(musdReceived, "MUSD transfer failed");

        // Liquidator receives seized collateral + bonus
        if (seizeNative) {
            (bool sent, ) = payable(msg.sender).call{value: collateralSeized}("");
            require(sent, "Native transfer failed");
        } else {
            bool transferred = IERC20(tbtcToken).transfer(msg.sender, collateralSeized);
            require(transferred, "tBTC transfer failed");
        }

        emit PositionLiquidated(user, msg.sender, debtToRepay, collateralSeized, seizeNative);
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
