// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MezoFlowVault.sol";
import "../src/PayrollStreamer.sol";

contract MockERC20 is IERC20, IERC20Stream {
    string public name;
    string public symbol;
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address recipient, uint256 amount) external override(IERC20, IERC20Stream) returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Balance low");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override(IERC20, IERC20Stream) returns (bool) {
        require(balanceOf[sender] >= amount, "Balance low");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override(IERC20, IERC20Stream) returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract MockOracle is IPriceFeed {
    uint256 public price;

    constructor(uint256 _price) {
        price = _price;
    }

    function setPrice(uint256 _price) external {
        price = _price;
    }

    function fetchPrice() external view override returns (uint256) {
        return price;
    }
}

contract SelfHealingTroveTest is Test {
    MezoFlowVault vault;
    PayrollStreamer streamer;
    MockERC20 tbtc;
    MockERC20 musd;
    MockOracle oracle;

    address employer = address(0xAA);
    address employee = address(0xBB);
    address keeper = address(0xCC);
    address charlie = address(0xDD);

    function setUp() public {
        tbtc = new MockERC20("Test Bitcoin", "tBTC");
        musd = new MockERC20("Mezo USD", "MUSD");
        oracle = new MockOracle(80000 ether); // $80,000 / BTC

        vault = new MezoFlowVault(
            address(tbtc),
            address(musd),
            address(oracle),
            address(0),
            address(0),
            address(0),
            address(0)
        );

        streamer = new PayrollStreamer(address(musd));

        // Connect vault and streamer
        vault.setPayrollStreamer(address(streamer));
        streamer.setVault(address(vault));

        // Fund vault with MUSD liquidity so it can lend
        musd.mint(address(vault), 1000000 ether);

        // Fund employer with tBTC and native BTC
        tbtc.mint(employer, 10 ether);
        vm.deal(employer, 10 ether);

        // Fund employer with MUSD to seed payroll streams
        musd.mint(employer, 50000 ether);
    }

    function testAutoHealTriggersWhenIcrDrops() public {
        // 1. Employer deposits 1 tBTC ($80,000 value)
        vm.startPrank(employer);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether);

        // 2. Employer borrows 40,000 MUSD (50% LTV, ICR = 200%)
        vault.borrowMUSD(40000 ether);
        assertEq(vault.borrowedMUSD(employer), 40000 ether);

        // 3. Employer creates a 30-day payroll stream of 10,000 MUSD for employee
        musd.approve(address(streamer), 10000 ether);
        uint256 streamId = streamer.createStream(employee, 10000 ether, 30 days);
        vm.stopPrank();

        // Initially Trove is healthy (ICR = 200%)
        (bool eligibleInitial, uint256 icrInitial) = vault.isAutoHealEligible(employer);
        assertFalse(eligibleInitial);
        assertEq(icrInitial, 200e16); // 200%

        // 4. Market crash: BTC price plunges from $80,000 to $50,000
        // Collateral value = $50,000. Debt = $40,000.
        // New ICR = 50,000 / 40,000 = 125% (< 135% threshold!)
        oracle.setPrice(50000 ether);

        (bool eligiblePostCrash, uint256 icrPostCrash) = vault.isAutoHealEligible(employer);
        assertTrue(eligiblePostCrash);
        assertEq(icrPostCrash, 125e16); // 125%

        // 5. Keeper or automated bot triggers autoHealTrove()
        vm.prank(keeper);
        vault.autoHealTrove(employer, streamId);

        // 6. Verify Trove debt was paid down and ICR restored!
        uint256 debtAfter = vault.borrowedMUSD(employer);
        assertTrue(debtAfter < 40000 ether, "Debt should have been reduced");

        // Verify unvested stream balance decreased
        uint256 unvestedAfter = streamer.getUnvestedBuffer(streamId);
        assertTrue(unvestedAfter < 10000 ether, "Stream buffer should have funded auto-heal");

        // Verify post-heal health
        uint256 postHealHealth = vault.getHealthFactor(employer);
        assertTrue(postHealHealth >= 135e16, "Health factor restored above danger zone");
    }

    function testAutoHealProtectsVestedSalary() public {
        // Employer deposits collateral and borrows debt
        vm.startPrank(employer);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether);
        vault.borrowMUSD(40000 ether);

        // Creates 4,000 MUSD stream for 40 days (100 MUSD / day)
        musd.approve(address(streamer), 4000 ether);
        uint256 streamId = streamer.createStream(employee, 4000 ether, 40 days);
        vm.stopPrank();

        // 10 days pass -> 1,000 MUSD has vested to employee!
        vm.warp(block.timestamp + 10 days);
        assertEq(streamer.balanceOf(streamId), 1000 ether);

        // Price drops: trigger auto-heal
        oracle.setPrice(48000 ether); // ICR drops
        vault.autoHealTrove(employer, streamId);

        // Employee MUST still be able to withdraw their full 1,000 vested MUSD!
        uint256 employeeBalanceBefore = musd.balanceOf(employee);
        vm.prank(employee);
        streamer.withdrawFromStream(streamId);
        uint256 employeeBalanceAfter = musd.balanceOf(employee);

        assertEq(employeeBalanceAfter - employeeBalanceBefore, 1000 ether, "Vested salary was 100% protected");
    }

    function testAutoHealRevertsIfTroveIsHealthy() public {
        vm.startPrank(employer);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether);
        vault.borrowMUSD(20000 ether); // 25% LTV, ICR = 400% (super healthy)

        musd.approve(address(streamer), 5000 ether);
        uint256 streamId = streamer.createStream(employee, 5000 ether, 30 days);
        vm.stopPrank();

        // Calling auto-heal on healthy trove MUST revert
        vm.expectRevert("Trove is healthy or not eligible for auto-heal");
        vault.autoHealTrove(employer, streamId);
    }

    function testStreamSplitterDirectRepayment() public {
        // Employer borrows 20,000 MUSD
        vm.startPrank(employer);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether);
        vault.borrowMUSD(20000 ether);

        // Creates 4,000 MUSD stream for employee
        musd.approve(address(streamer), 4000 ether);
        uint256 streamId = streamer.createStream(employee, 4000 ether, 40 days);
        vm.stopPrank();

        // Employee configures 25% split (2500 bps) to auto-repay employer debt
        vm.prank(employee);
        streamer.setStreamSplit(streamId, 2500, employer);

        // 20 days pass -> 2,000 MUSD vested
        vm.warp(block.timestamp + 20 days);
        assertEq(streamer.balanceOf(streamId), 2000 ether);

        uint256 employerDebtBefore = vault.borrowedMUSD(employer);
        uint256 employeeBalanceBefore = musd.balanceOf(employee);

        // Employee withdraws vested amount
        vm.prank(employee);
        streamer.withdrawFromStream(streamId);

        uint256 employeeBalanceAfter = musd.balanceOf(employee);
        uint256 employerDebtAfter = vault.borrowedMUSD(employer);

        // 75% (1500 MUSD) sent to employee wallet
        assertEq(employeeBalanceAfter - employeeBalanceBefore, 1500 ether);

        // 25% (500 MUSD) directly reduced employer debt!
        assertEq(employerDebtBefore - employerDebtAfter, 500 ether);
    }

    function testStreamSplitterMaxSplitBoundaryReverts() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 1000 ether);
        uint256 streamId = streamer.createStream(employee, 1000 ether, 10 days);
        vm.stopPrank();

        // Trying to split > 50% must revert
        vm.prank(employee);
        vm.expectRevert("Max auto-repay split is 50%");
        streamer.setStreamSplit(streamId, 5001, employer);
    }

    function testAutoHealUnauthorizedStreamReclaimReverts() public {
        vm.startPrank(employer);
        musd.approve(address(streamer), 1000 ether);
        uint256 streamId = streamer.createStream(employee, 1000 ether, 10 days);
        vm.stopPrank();

        // Random caller cannot reclaim buffer
        vm.prank(charlie);
        vm.expectRevert("Only authorized vault");
        streamer.emergencyReclaimForDebt(streamId, 500 ether);
    }
}
