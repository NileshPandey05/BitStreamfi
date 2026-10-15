// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Stream {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/**
 * @title PayrollStreamer
 * @notice Second-by-second MUSD salary streaming for employers and contractors with streaming controls.
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

    address public immutable musdToken;
    mapping(uint256 => Stream) public streams;
    uint256 public nextStreamId;

    event StreamCreated(uint256 indexed streamId, address indexed employer, address indexed recipient, uint256 depositAmount);
    event StreamWithdrawn(uint256 indexed streamId, uint256 amount);
    event StreamCancelled(uint256 indexed streamId, uint256 refundToEmployer, uint256 paidToRecipient);
    event StreamToppedUp(uint256 indexed streamId, uint256 addedAmount);

    constructor(address _musd) {
        musdToken = _musd;
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

    function withdrawFromStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(stream.active, "Stream not active");
        require(msg.sender == stream.recipient, "Not recipient");

        uint256 recoverable = balanceOf(streamId);
        require(recoverable > 0, "Nothing to withdraw");

        stream.withdrawnAmount += recoverable;
        if (block.timestamp >= stream.stopTime) {
            stream.active = false;
        }

        bool success = IERC20Stream(musdToken).transfer(stream.recipient, recoverable);
        require(success, "Transfer failed");

        emit StreamWithdrawn(streamId, recoverable);
    }

    function balanceOf(uint256 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (!stream.active) return 0;

        uint256 duration = stream.stopTime - stream.startTime;
        uint256 elapsed = block.timestamp > stream.startTime ? block.timestamp - stream.startTime : 0;
        if (elapsed > duration) {
            elapsed = duration;
        }

        uint256 totalStreamable = (stream.depositAmount * elapsed) / duration;
        return totalStreamable - stream.withdrawnAmount;
    }
}
