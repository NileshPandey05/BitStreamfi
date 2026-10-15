// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MezoFlowVault.sol";
import "../src/PayrollStreamer.sol";

contract MockERC20 is IERC20 {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    mapping(address => uint256) public balanceOfToken;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOfToken[to] += amount;
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(balanceOfToken[msg.sender] >= amount, "Balance low");
        balanceOfToken[msg.sender] -= amount;
        balanceOfToken[recipient] += amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(balanceOfToken[sender] >= amount, "Balance low");
        balanceOfToken[sender] -= amount;
        balanceOfToken[recipient] += amount;
        return true;
    }

    function balanceAccount(address account) external view override returns (uint256) {
        return balanceOfToken[account];
    }
}

contract MezoFlowTest is Test {
    MezoFlowVault vault;
    PayrollStreamer streamer;
    MockERC20 tbtc;
    MockERC20 musd;

    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        tbtc = new MockERC20();
        musd = new MockERC20();

        vault = new MezoFlowVault(address(tbtc), address(musd));
        streamer = new PayrollStreamer(address(musd));

        tbtc.mint(alice, 10 ether);
        musd.mint(address(vault), 100000 ether);
        musd.mint(alice, 10000 ether);
    }

    function testDepositAndBorrow() public {
        vm.startPrank(alice);
        tbtc.transferFrom(alice, address(this), 0); // approval mock
        // deposit 1 tBTC
        tbtc.transfer(address(vault), 1 ether);
        // Note: Vault uses transferFrom, so let's approve first
        // Let's re-test properly via transferFrom
    }

    function testVaultDepositAndBorrowFlow() public {
        vm.startPrank(alice);
        tbtc.mint(alice, 2 ether);
        // We need approval for transferFrom
        // MockERC20 transferFrom doesn't check allowance in our simple mock, but let's test deposit
        vault.depositCollateral(1 ether);
        assertEq(vault.collateralBalances(alice), 1 ether);

        // Borrow MUSD (1 tBTC = $60,000; Max LTV 60% = $36,000 MUSD)
        vault.borrowMUSD(10000 ether);
        assertEq(vault.borrowedMUSD(alice), 10000 ether);
        vm.stopPrank();
    }

    function testPayrollStreaming() public {
        vm.startPrank(alice);
        musd.mint(alice, 1000 ether);
        // For PayrollStreamer, approve or transfer simulation in mock
        // Since mock transferFrom doesn't check allowance, it will succeed
        uint256 streamId = streamer.createStream(bob, 3600 ether, 3600); // 3600 MUSD over 3600 seconds (1 MUSD per sec)
        assertEq(streamId, 0);
        vm.stopPrank();

        // Warp time by 1800 seconds (halfway)
        vm.warp(block.timestamp + 1800);

        uint256 streamable = streamer.balanceOf(0);
        assertEq(streamable, 1800 ether);

        vm.prank(bob);
        streamer.withdrawFromStream(0);
        assertEq(musd.balanceOfToken(bob), 1800 ether);
    }
}
