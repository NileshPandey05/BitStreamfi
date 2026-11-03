// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Stream {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IVaultRepay {
    function repayMUSDFor(address user, uint256 amount) external;
}

/**
 * @title PayrollStreamer
 * @notice Second-by-second MUSD salary streaming with closed-loop emergency debt reclaim
 * and worker stream-split debt amortization.
 */
contract PayrollStreamer {
    struct Stream {
        address employer;
        address recipient;
        uint256 depositAmount;
        uint256 startTime;
        uint256 stopTime;
        uint256 withdrawnAmount;
        bool active;
    }

    struct StreamSplitConfig {
        uint256 autoRepayBps; // Max 5000 (50%)
        address targetBorrower;
        bool enabled;
    }

    address public owner;
    address public vault;
    address public immutable musdToken;

    mapping(uint256 => Stream) public streams;
    mapping(uint256 => StreamSplitConfig) public streamSplits;
    uint256 public nextStreamId;

    event StreamCreated(uint256 indexed streamId, address indexed employer, address indexed recipient, uint256 depositAmount);
    event StreamWithdrawn(uint256 indexed streamId, uint256 amount);
    event StreamCancelled(uint256 indexed streamId, uint256 refundToEmployer, uint256 paidToRecipient);
    event StreamToppedUp(uint256 indexed streamId, uint256 addedAmount);
    event StreamEmergencyReclaimed(uint256 indexed streamId, uint256 reclaimedAmount, address caller);
    event StreamSplitConfigured(uint256 indexed streamId, uint256 autoRepayBps, address targetBorrower);
    event StreamSplitAmortized(uint256 indexed streamId, address indexed targetBorrower, uint256 amortizedAmount);
    event VaultUpdated(address newVault);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _musd) {
        owner = msg.sender;
        musdToken = _musd;
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function createStream(address recipient, uint256 depositAmount, uint256 duration) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(depositAmount > 0, "Deposit must be > 0");
        require(duration > 0, "Duration must be > 0");

        uint256 streamId = nextStreamId++;
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + duration;

        streams[streamId] = Stream({
            employer: msg.sender,
            recipient: recipient,
            depositAmount: depositAmount,
            startTime: startTime,
            stopTime: stopTime,
            withdrawnAmount: 0,
            active: true
        });

        bool success = IERC20Stream(musdToken).transferFrom(msg.sender, address(this), depositAmount);
        require(success, "TransferFrom failed");

        emit StreamCreated(streamId, msg.sender, recipient, depositAmount);
        return streamId;
    }

    function topUpStream(uint256 streamId, uint256 additionalAmount) external {
        Stream storage stream = streams[streamId];
        require(stream.active, "Stream not active");
        require(msg.sender == stream.employer, "Not employer");
        require(additionalAmount > 0, "Amount must be > 0");

        stream.depositAmount += additionalAmount;

        bool success = IERC20Stream(musdToken).transferFrom(msg.sender, address(this), additionalAmount);
        require(success, "TransferFrom failed");

        emit StreamToppedUp(streamId, additionalAmount);
    }

    function cancelStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(stream.active, "Stream not active");
        require(msg.sender == stream.employer || msg.sender == stream.recipient, "Not authorized");

        uint256 streamable = balanceOf(streamId);
        uint256 totalOwed = stream.withdrawnAmount + streamable;
        uint256 refund = stream.depositAmount > totalOwed ? stream.depositAmount - totalOwed : 0;

        stream.active = false;

        if (streamable > 0) {
            stream.withdrawnAmount += streamable;
            require(IERC20Stream(musdToken).transfer(stream.recipient, streamable), "Transfer to recipient failed");
        }

        if (refund > 0) {
            require(IERC20Stream(musdToken).transfer(stream.employer, refund), "Refund to employer failed");
        }

        emit StreamCancelled(streamId, refund, streamable);
    }

    function setStreamSplit(uint256 streamId, uint256 autoRepayBps, address targetBorrower) external {
        Stream storage stream = streams[streamId];
        require(stream.active, "Stream not active");
        require(msg.sender == stream.recipient, "Not recipient");
        require(autoRepayBps <= 5000, "Max auto-repay split is 50%");
        if (autoRepayBps > 0) {
            require(targetBorrower != address(0), "Invalid target borrower");
        }

        streamSplits[streamId] = StreamSplitConfig({
            autoRepayBps: autoRepayBps,
            targetBorrower: targetBorrower,
            enabled: autoRepayBps > 0
        });

        emit StreamSplitConfigured(streamId, autoRepayBps, targetBorrower);
    }

    function emergencyReclaimForDebt(uint256 streamId, uint256 maxAmount) external returns (uint256) {
        require(msg.sender == vault || msg.sender == owner, "Only authorized vault");
        Stream storage stream = streams[streamId];
        require(stream.active, "Stream not active");

        uint256 streamable = balanceOf(streamId);
        uint256 totalOwed = stream.withdrawnAmount + streamable;
        uint256 unvestedBuffer = stream.depositAmount > totalOwed ? stream.depositAmount - totalOwed : 0;
        require(unvestedBuffer > 0, "No unvested buffer available");

        uint256 reclaimAmount = maxAmount < unvestedBuffer ? maxAmount : unvestedBuffer;
        require(reclaimAmount > 0, "Reclaim amount is 0");

        stream.depositAmount -= reclaimAmount;
        if (stream.depositAmount <= totalOwed) {
            stream.stopTime = block.timestamp;
        }

        bool success = IERC20Stream(musdToken).transfer(msg.sender, reclaimAmount);
        require(success, "Transfer to vault failed");

        emit StreamEmergencyReclaimed(streamId, reclaimAmount, msg.sender);
        return reclaimAmount;
    }

    function withdrawFromStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.recipient, "Not recipient");

        uint256 recoverable = balanceOf(streamId);
        require(recoverable > 0, "Nothing to withdraw");

        stream.withdrawnAmount += recoverable;
        if (stream.withdrawnAmount >= stream.depositAmount) {
            stream.active = false;
        }

        StreamSplitConfig memory split = streamSplits[streamId];
        if (split.enabled && split.autoRepayBps > 0 && vault != address(0)) {
            uint256 splitAmount = (recoverable * split.autoRepayBps) / 10000;
            uint256 recipientAmount = recoverable - splitAmount;

            if (recipientAmount > 0) {
                bool success = IERC20Stream(musdToken).transfer(stream.recipient, recipientAmount);
                require(success, "Recipient transfer failed");
            }

            if (splitAmount > 0) {
                IERC20Stream(musdToken).approve(vault, splitAmount);
                IVaultRepay(vault).repayMUSDFor(split.targetBorrower, splitAmount);
                emit StreamSplitAmortized(streamId, split.targetBorrower, splitAmount);
            }
        } else {
            bool success = IERC20Stream(musdToken).transfer(stream.recipient, recoverable);
            require(success, "Transfer failed");
        }

        emit StreamWithdrawn(streamId, recoverable);
    }

    function balanceOf(uint256 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (stream.withdrawnAmount >= stream.depositAmount) return 0;

        uint256 duration = stream.stopTime > stream.startTime ? stream.stopTime - stream.startTime : 1;
        uint256 elapsed = block.timestamp > stream.startTime ? block.timestamp - stream.startTime : 0;
        if (elapsed > duration) {
            elapsed = duration;
        }

        uint256 totalStreamable = (stream.depositAmount * elapsed) / duration;
        if (totalStreamable <= stream.withdrawnAmount) return 0;
        return totalStreamable - stream.withdrawnAmount;
    }

    function getUnvestedBuffer(uint256 streamId) external view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (!stream.active) return 0;
        uint256 streamable = balanceOf(streamId);
        uint256 totalOwed = stream.withdrawnAmount + streamable;
        return stream.depositAmount > totalOwed ? stream.depositAmount - totalOwed : 0;
    }
}
