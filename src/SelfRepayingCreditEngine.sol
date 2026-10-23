// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVault {
    function borrowedMUSD(address user) external view returns (uint256);
    function repayMUSDFor(address user, uint256 amount) external;
}

interface IERC20Engine {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @title SelfRepayingCreditEngine
 * @notice Channels yield or deposits into automated MUSD debt amortization for MezoFlow Vault users.
 */
contract SelfRepayingCreditEngine {
    address public immutable vault;
    address public immutable musdToken;

    mapping(address => uint256) public stakingYieldBalances;

    event YieldDeposited(address indexed user, uint256 amount);
    event DebtAmortized(address indexed user, uint256 amount);

    constructor(address _vault, address _musd) {
        vault = _vault;
        musdToken = _musd;
    }

    function depositYield(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        stakingYieldBalances[msg.sender] += amount;
        bool success = IERC20Engine(musdToken).transferFrom(msg.sender, address(this), amount);
        require(success, "TransferFrom failed");
        emit YieldDeposited(msg.sender, amount);
    }

    function amortizeDebt(address user, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(stakingYieldBalances[user] >= amount, "Insufficient yield balance");

        stakingYieldBalances[user] -= amount;

        // Repay debt on behalf of user
        IERC20Engine(musdToken).approve(vault, amount);
        IVault(vault).repayMUSDFor(user, amount);
        emit DebtAmortized(user, amount);
    }
}
