// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SelfRepayingCreditEngine.sol";

contract MockVault is IVault {
    mapping(address => uint256) public override borrowedMUSD;

    function setBorrowed(address user, uint256 amount) external {
        borrowedMUSD[user] = amount;
    }

    function repayMUSDFor(address user, uint256 amount) external override {
        require(borrowedMUSD[user] >= amount, "Amount exceeds debt");
        borrowedMUSD[user] -= amount;
    }
}

contract MockCreditERC20 is IERC20Engine {
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

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract SelfRepayingCreditEngineTest is Test {
    SelfRepayingCreditEngine creditEngine;
    MockVault vault;
    MockCreditERC20 musd;

    address alice = address(0x1);
    address bob = address(0x2);

    function setUp() public {
        vault = new MockVault();
        musd = new MockCreditERC20();
        creditEngine = new SelfRepayingCreditEngine(address(vault), address(musd));

        musd.mint(alice, 10000 ether);
        musd.mint(bob, 5000 ether);
        vault.setBorrowed(alice, 6000 ether);
    }

    function testDepositYield() public {
        vm.startPrank(alice);
        musd.approve(address(creditEngine), 3000 ether);
        creditEngine.depositYield(3000 ether);

        assertEq(creditEngine.stakingYieldBalances(alice), 3000 ether);
        assertEq(musd.balanceOf(alice), 7000 ether);
        assertEq(musd.balanceOf(address(creditEngine)), 3000 ether);
        vm.stopPrank();
    }

    function testWithdrawYieldSuccess() public {
        // High severity fix test: unwithdrawable yield balance is fixed
        vm.startPrank(alice);
        musd.approve(address(creditEngine), 4000 ether);
        creditEngine.depositYield(4000 ether);

        // Withdraw 1500 MUSD of unamortized yield
        creditEngine.withdrawYield(1500 ether);
        assertEq(creditEngine.stakingYieldBalances(alice), 2500 ether);
        assertEq(musd.balanceOf(alice), 7500 ether);

        // Withdraw remaining 2500 MUSD
        creditEngine.withdrawYield(2500 ether);
        assertEq(creditEngine.stakingYieldBalances(alice), 0);
        assertEq(musd.balanceOf(alice), 10000 ether);
        vm.stopPrank();
    }

    function testWithdrawYieldInsufficientBalanceReverts() public {
        vm.startPrank(alice);
        musd.approve(address(creditEngine), 1000 ether);
        creditEngine.depositYield(1000 ether);

        vm.expectRevert("Insufficient yield balance");
        creditEngine.withdrawYield(1001 ether);
        vm.stopPrank();
    }

    function testAmortizeDebt() public {
        vm.startPrank(alice);
        musd.approve(address(creditEngine), 5000 ether);
        creditEngine.depositYield(5000 ether);

        // Amortize 2000 MUSD of debt
        creditEngine.amortizeDebt(alice, 2000 ether);
        assertEq(creditEngine.stakingYieldBalances(alice), 3000 ether);
        assertEq(vault.borrowedMUSD(alice), 4000 ether);

        // Amortize remaining 3000 MUSD of debt
        creditEngine.amortizeDebt(alice, 3000 ether);
        assertEq(creditEngine.stakingYieldBalances(alice), 0);
        assertEq(vault.borrowedMUSD(alice), 1000 ether);
        vm.stopPrank();
    }

    function testAmortizeDebtInsufficientYieldReverts() public {
        vm.startPrank(alice);
        musd.approve(address(creditEngine), 1000 ether);
        creditEngine.depositYield(1000 ether);

        vm.expectRevert("Insufficient yield balance");
        creditEngine.amortizeDebt(alice, 2000 ether);
        vm.stopPrank();
    }

    function testZeroAmountValidationReverts() public {
        vm.startPrank(alice);
        vm.expectRevert("Amount must be > 0");
        creditEngine.depositYield(0);

        vm.expectRevert("Amount must be > 0");
        creditEngine.withdrawYield(0);

        vm.expectRevert("Amount must be > 0");
        creditEngine.amortizeDebt(alice, 0);
        vm.stopPrank();
    }
}
