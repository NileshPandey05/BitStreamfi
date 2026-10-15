// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceAccount(address account) external view returns (uint256);
}

/**
 * @title MezoFlowVault
 * @notice Vault for depositing tBTC collateral and minting/borrowing MUSD stablecoin on Mezo Network.
 * # ponytail: naive LTV calculation, upgrade to oracle-backed TWAP pricing if production scale requires.
 */
contract MezoFlowVault {
    address public owner;
    address public immutable tbtcToken;
    address public immutable musdToken;

    uint256 public constant MAX_LTV_BPS = 6000; // 60%
    uint256 public constant BPS_DENOMINATOR = 10000;

    mapping(address => uint256) public collateralBalances;
    mapping(address => uint256) public borrowedMUSD;

    bool private locked;

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event MUSDBorrowed(address indexed user, uint256 amount);
    event MUSARepaid(address indexed user, uint256 amount);

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

    constructor(address _tbtc, address _musd) {
        owner = msg.sender;
        tbtcToken = _tbtc;
        musdToken = _musd;
    }

    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        collateralBalances[msg.sender] += amount;
        bool success = IERC20(tbtcToken).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");
        emit CollateralDeposited(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(collateralBalances[msg.sender] >= amount, "Insufficient collateral");

        uint256 remainingCollateral = collateralBalances[msg.sender] - amount;
        uint256 collateralValueUSD = remainingCollateral * 60000; // Mock 1 tBTC = $60,000
        uint256 maxBorrow = (collateralValueUSD * MAX_LTV_BPS) / BPS_DENOMINATOR;
        require(borrowedMUSD[msg.sender] <= maxBorrow, "Position would be undercollateralized");

        collateralBalances[msg.sender] = remainingCollateral;
        bool success = IERC20(tbtcToken).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        emit CollateralWithdrawn(msg.sender, amount);
    }

    function borrowMUSD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        uint256 collateralValueUSD = collateralBalances[msg.sender] * 60000;
        uint256 maxBorrow = (collateralValueUSD * MAX_LTV_BPS) / BPS_DENOMINATOR;

        require(borrowedMUSD[msg.sender] + amount <= maxBorrow, "Exceeds max LTV");

        borrowedMUSD[msg.sender] += amount;
        bool success = IERC20(musdToken).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        emit MUSDBorrowed(msg.sender, amount);
    }

    function repayMUSD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        borrowedMUSD[msg.sender] -= amount;
        bool success = IERC20(musdToken).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");
        emit MUSARepaid(msg.sender, amount);
    }
}
