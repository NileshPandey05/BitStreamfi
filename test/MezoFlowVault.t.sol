// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MezoFlowVault.sol";
import "../src/PayrollStreamer.sol";
import "../src/SelfRepayingCreditEngine.sol";

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

    function balanceOf(address account) external view override returns (uint256) {
        return balanceOfToken[account];
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract MezoFlowTest is Test {
    MezoFlowVault vault;
    PayrollStreamer streamer;
    SelfRepayingCreditEngine creditEngine;
    MockERC20 tbtc;
    MockERC20 musd;

    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        tbtc = new MockERC20();
        musd = new MockERC20();

        vault = new MezoFlowVault(address(tbtc), address(musd));
        streamer = new PayrollStreamer(address(musd));
        creditEngine = new SelfRepayingCreditEngine(address(vault), address(musd));

        tbtc.mint(alice, 10 ether);
        musd.mint(address(vault), 100000 ether);
        musd.mint(alice, 10000 ether);
    }

    function testVaultDepositAndBorrowFlow() public {
        vm.startPrank(alice);
        vault.depositCollateral(1 ether);
        assertEq(vault.collateralBalances(alice), 1 ether);

        vault.borrowMUSD(10000 ether);
        assertEq(vault.borrowedMUSD(alice), 10000 ether);
        vm.stopPrank();
    }

    function testPayrollStreamingAndControls() public {
        vm.startPrank(alice);
        uint256 streamId = streamer.createStream(bob, 3600 ether, 3600);
        assertEq(streamId, 0);

        // Top up stream
        streamer.topUpStream(0, 3600 ether);

        // Warp time by 1800 seconds
        vm.warp(block.timestamp + 1800);

        uint256 streamable = streamer.balanceOf(0);
        assertEq(streamable, 3600 ether); // (7200 * 1800) / 3600 = 3600

        // Cancel stream
        streamer.cancelStream(0);
        vm.stopPrank();
    }

    function testSelfRepayingCreditEngine() public {
        vm.startPrank(alice);
        vault.depositCollateral(1 ether);
        vault.borrowMUSD(10000 ether);

        musd.mint(alice, 5000 ether);
        creditEngine.depositYield(5000 ether);
        assertEq(creditEngine.stakingYieldBalances(alice), 5000 ether);

        // Test amortizeDebt
        creditEngine.amortizeDebt(alice, 2000 ether);
        assertEq(creditEngine.stakingYieldBalances(alice), 3000 ether);
        assertEq(vault.borrowedMUSD(alice), 8000 ether);
        vm.stopPrank();
    }

    function testBorrowExceedsMaxLTVReverts() public {
        vm.startPrank(alice);
        vault.depositCollateral(1 ether); // 1 tBTC = $60,000 => max borrow 60% = 36,000 MUSD

        // Borrowing 36,001 MUSD should fail
        vm.expectRevert("Exceeds max LTV");
        vault.borrowMUSD(36001 ether);

        // Borrowing 36,000 MUSD succeeds
        vault.borrowMUSD(36000 ether);
        assertEq(vault.borrowedMUSD(alice), 36000 ether);
        vm.stopPrank();
    }

    function testRepayExceedsDebtReverts() public {
        vm.startPrank(alice);
        vault.depositCollateral(1 ether);
        vault.borrowMUSD(5000 ether);

        vm.expectRevert("Amount exceeds debt");
        vault.repayMUSD(5001 ether);
        vm.stopPrank();
    }

    function testWithdrawCollateralLTVBoundary() public {
        vm.startPrank(alice);
        vault.depositCollateral(2 ether); // $120,000
        vault.borrowMUSD(50000 ether); // $50,000 debt

        // Withdrawing 1 ether leaves 1 ether ($60,000 max borrow $36,000 < $50,000 debt) -> should revert
        vm.expectRevert("Position would be undercollateralized");
        vault.withdrawCollateral(1 ether);

        // Withdrawing 0.5 ether leaves 1.5 ether ($90,000 max borrow $54,000 >= $50,000 debt) -> should pass
        vault.withdrawCollateral(0.5 ether);
        assertEq(vault.collateralBalances(alice), 1.5 ether);
        vm.stopPrank();
    }
}
