// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PayrollStreamer.sol";

contract MockToken is IERC20Stream {
    string public name = "Mezo USD";
    string public symbol = "MUSD";
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Balance low");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(balanceOf[sender] >= amount, "Balance low");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract PayrollStreamerTest is Test {
    PayrollStreamer streamer;
    MockToken musd;

    address employer = address(0x10);
    address employee = address(0x20);
    address charlie = address(0x30);

    function setUp() public {
        musd = new MockToken();
        streamer = new PayrollStreamer(address(musd));

        musd.mint(employer, 100000 ether);
        vm.deal(employer, 10 ether);
        vm.deal(employee, 10 ether);
    }

    function testCreateStreamSuccess() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);

        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);
        assertEq(streamId, 0);
        assertEq(streamer.nextStreamId(), 1);

        (
            address _employer,
            address _recipient,
            uint256 _depositAmount,
            uint256 _startTime,
            uint256 _stopTime,
            uint256 _withdrawnAmount,
            bool _active
        ) = streamer.streams(streamId);

        assertEq(_employer, employer);
        assertEq(_recipient, employee);
        assertEq(_depositAmount, 3600 ether);
        assertEq(_stopTime - _startTime, 3600);
        assertEq(_withdrawnAmount, 0);
        assertTrue(_active);
        vm.stopPrank();
    }

    function testLinearVestingOverTime() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);
        vm.stopPrank();

        // Initially 0 streamable
        assertEq(streamer.balanceOf(streamId), 0);

        // 900 seconds (25% elapsed) -> 900 MUSD vested
        vm.warp(block.timestamp + 900);
        assertEq(streamer.balanceOf(streamId), 900 ether);

        // 1800 seconds (50% elapsed) -> 1800 MUSD vested
        vm.warp(block.timestamp + 900);
        assertEq(streamer.balanceOf(streamId), 1800 ether);

        // 3600 seconds (100% elapsed) -> full 3600 MUSD vested
        vm.warp(block.timestamp + 1800);
        assertEq(streamer.balanceOf(streamId), 3600 ether);

        // After stream ends, stays at full deposit
        vm.warp(block.timestamp + 1000);
        assertEq(streamer.balanceOf(streamId), 3600 ether);
    }

    function testRecipientWithdrawFromStream() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);
        vm.stopPrank();

        // Warp 1000 seconds
        vm.warp(block.timestamp + 1000);

        // Employee withdraws vested amount
        vm.startPrank(employee);
        streamer.withdrawFromStream(streamId);
        assertEq(musd.balanceOf(employee), 1000 ether);
        assertEq(streamer.balanceOf(streamId), 0);

        // Warp another 1000 seconds
        vm.warp(block.timestamp + 1000);
        assertEq(streamer.balanceOf(streamId), 1000 ether);

        streamer.withdrawFromStream(streamId);
        assertEq(musd.balanceOf(employee), 2000 ether);
        vm.stopPrank();
    }

    function testNonRecipientWithdrawReverts() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);
        vm.stopPrank();

        vm.warp(block.timestamp + 1000);

        vm.startPrank(charlie);
        vm.expectRevert("Not recipient");
        streamer.withdrawFromStream(streamId);
        vm.stopPrank();
    }

    function testTopUpStream() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 7200 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);

        streamer.topUpStream(streamId, 3600 ether);

        (, , uint256 _depositAmount, , , , ) = streamer.streams(streamId);
        assertEq(_depositAmount, 7200 ether);

        // Halfway through 3600s: 1800s elapsed -> 3600 MUSD vested
        vm.warp(block.timestamp + 1800);
        assertEq(streamer.balanceOf(streamId), 3600 ether);
        vm.stopPrank();
    }

    function testEmployerCancelStreamRefundsCorrectly() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);

        // Warp 900 seconds (25% elapsed)
        vm.warp(block.timestamp + 900);

        uint256 employerBefore = musd.balanceOf(employer);
        uint256 employeeBefore = musd.balanceOf(employee);

        streamer.cancelStream(streamId);

        // Employee receives vested 900 MUSD, Employer refunded remaining 2700 MUSD
        assertEq(musd.balanceOf(employee) - employeeBefore, 900 ether);
        assertEq(musd.balanceOf(employer) - employerBefore, 2700 ether);

        // Stream is now inactive
        (, , , , , , bool _active) = streamer.streams(streamId);
        assertFalse(_active);
        assertEq(streamer.balanceOf(streamId), 0);
        vm.stopPrank();
    }

    function testRecipientCanAlsoCancelStream() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);
        vm.stopPrank();

        vm.warp(block.timestamp + 1800);

        vm.startPrank(employee);
        streamer.cancelStream(streamId);

        assertEq(musd.balanceOf(employee), 1800 ether);
        assertEq(musd.balanceOf(employer), 100000 ether - 3600 ether + 1800 ether);
        vm.stopPrank();
    }

    function testUnauthorizedCancelReverts() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 3600 ether);
        uint256 streamId = streamer.createStream(employee, 3600 ether, 3600);
        vm.stopPrank();

        vm.startPrank(charlie);
        vm.expectRevert("Not authorized");
        streamer.cancelStream(streamId);
        vm.stopPrank();
    }

    function testValidationReverts() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 10000 ether);

        vm.expectRevert("Invalid recipient");
        streamer.createStream(address(0), 1000 ether, 3600);

        vm.expectRevert("Deposit must be > 0");
        streamer.createStream(employee, 0, 3600);

        vm.expectRevert("Duration must be > 0");
        streamer.createStream(employee, 1000 ether, 0);
        vm.stopPrank();
    }
}
