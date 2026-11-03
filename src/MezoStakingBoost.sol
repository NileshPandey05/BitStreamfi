// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Staking {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title MezoStakingBoost
 * @notice Dual-token MEZO Governance staking mechanism that grants tiered vault fee discounts,
 * keeper liquidation bonus boosts, and pro-rata MUSD protocol revenue share.
 */
contract MezoStakingBoost {
    enum Tier { Standard, Bronze, Silver, Gold }

    struct UnbondingRequest {
        uint256 amount;
        uint256 releaseTime;
    }

    address public owner;
    address public vault;
    address public immutable mezoToken;
    address public immutable rewardToken; // MUSD

    // Tier Thresholds (in MEZO with 18 decimals)
    uint256 public constant BRONZE_THRESHOLD = 100 * 1e18;
    uint256 public constant SILVER_THRESHOLD = 500 * 1e18;
    uint256 public constant GOLD_THRESHOLD = 2500 * 1e18;

    // Cooldown duration (default 2 days; owner can configure down to 0 for tests)
    uint256 public cooldownPeriod = 2 days;

    // Staking Balances
    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    // Unbonding Queue: user => UnbondingRequest
    mapping(address => UnbondingRequest) public unbondingRequests;

    // Synthetix-style pro-rata MUSD dividend accumulator
    uint256 public rewardPerTokenStored;
    uint256 public undistributedRewards;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // Events
    event Staked(address indexed user, uint256 amount, Tier newTier);
    event UnstakeInitiated(address indexed user, uint256 amount, uint256 releaseTime);
    event UnstakeClaimed(address indexed user, uint256 amount);
    event UnstakeCancelled(address indexed user, uint256 amount);
    event RewardDeposited(address indexed from, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event CooldownUpdated(uint256 newCooldown);
    event VaultUpdated(address indexed newVault);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier updateReward(address account) {
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _mezoToken, address _rewardToken) {
        require(_mezoToken != address(0), "Invalid MEZO token");
        require(_rewardToken != address(0), "Invalid reward token");
        owner = msg.sender;
        mezoToken = _mezoToken;
        rewardToken = _rewardToken;
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function setCooldownPeriod(uint256 _cooldown) external onlyOwner {
        require(_cooldown <= 7 days, "Cooldown too long");
        cooldownPeriod = _cooldown;
        emit CooldownUpdated(_cooldown);
    }

    // --- Staking Logic ---

    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Amount must be > 0");

        if (totalStaked == 0 && undistributedRewards > 0) {
            rewardPerTokenStored += (undistributedRewards * 1e18) / amount;
            undistributedRewards = 0;
            userRewardPerTokenPaid[msg.sender] = rewardPerTokenStored;
        }

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        bool success = IERC20Staking(mezoToken).transferFrom(msg.sender, address(this), amount);
        require(success, "MEZO transfer failed");

        emit Staked(msg.sender, amount, getTier(msg.sender));
    }

    function initiateUnstake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Amount must be > 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        require(unbondingRequests[msg.sender].amount == 0, "Pending unbond exists");

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        uint256 release = block.timestamp + cooldownPeriod;
        unbondingRequests[msg.sender] = UnbondingRequest({
            amount: amount,
            releaseTime: release
        });

        emit UnstakeInitiated(msg.sender, amount, release);
    }

    function claimUnstaked() external {
        UnbondingRequest memory request = unbondingRequests[msg.sender];
        require(request.amount > 0, "No pending unbond");
        require(block.timestamp >= request.releaseTime, "Cooldown active");

        uint256 amount = request.amount;
        delete unbondingRequests[msg.sender];

        bool success = IERC20Staking(mezoToken).transfer(msg.sender, amount);
        require(success, "MEZO transfer failed");

        emit UnstakeClaimed(msg.sender, amount);
    }

    function cancelUnstake() external updateReward(msg.sender) {
        UnbondingRequest memory request = unbondingRequests[msg.sender];
        require(request.amount > 0, "No pending unbond");

        uint256 amount = request.amount;
        delete unbondingRequests[msg.sender];

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit UnstakeCancelled(msg.sender, amount);
    }

    // --- Dividend / Reward Distribution Logic ---

    function depositProtocolRevenue(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        bool success = IERC20Staking(rewardToken).transferFrom(msg.sender, address(this), amount);
        require(success, "Reward transfer failed");

        uint256 total = amount + undistributedRewards;
        if (totalStaked > 0) {
            rewardPerTokenStored += (total * 1e18) / totalStaked;
            undistributedRewards = 0;
        } else {
            undistributedRewards += amount;
        }
        emit RewardDeposited(msg.sender, amount);
    }

    function earned(address account) public view returns (uint256) {
        uint256 pendingPerToken = rewardPerTokenStored - userRewardPerTokenPaid[account];
        return rewards[account] + ((stakedBalance[account] * pendingPerToken) / 1e18);
    }

    function claimRewards() external updateReward(msg.sender) returns (uint256) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            bool success = IERC20Staking(rewardToken).transfer(msg.sender, reward);
            require(success, "Reward transfer failed");
            emit RewardClaimed(msg.sender, reward);
        }
        return reward;
    }

    // --- Tier & Benefit Views ---

    function getTier(address user) public view returns (Tier) {
        uint256 balance = stakedBalance[user];
        if (balance >= GOLD_THRESHOLD) {
            return Tier.Gold;
        } else if (balance >= SILVER_THRESHOLD) {
            return Tier.Silver;
        } else if (balance >= BRONZE_THRESHOLD) {
            return Tier.Bronze;
        }
        return Tier.Standard;
    }

    function getFeeDiscountBps(address user) external view returns (uint256) {
        Tier tier = getTier(user);
        if (tier == Tier.Gold) return 5000;    // 50% discount
        if (tier == Tier.Silver) return 3000;  // 30% discount
        if (tier == Tier.Bronze) return 1500;  // 15% discount
        return 0;                              // 0% discount
    }

    function getKeeperBonusBoostBps(address user) external view returns (uint256) {
        Tier tier = getTier(user);
        if (tier == Tier.Gold) return 250;     // +2.5% extra bonus (total 7.5%)
        if (tier == Tier.Silver) return 100;   // +1.0% extra bonus (total 6.0%)
        return 0;                              // standard 5%
    }
}
