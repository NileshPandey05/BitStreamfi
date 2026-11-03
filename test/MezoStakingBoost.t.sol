// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MezoFlowVault.sol";
import "../src/MezoStakingBoost.sol";
import "./MezoFlowVault.t.sol";

contract MezoStakingBoostTest is Test {
    MezoFlowVault vault;
    MezoStakingBoost stakingBoost;
    MockPriceFeed priceFeed;
    MockERC20 tbtc;
    MockERC20 musd;
    MockERC20 mezo;

    address alice = address(0x11);
    address bob = address(0x22);
    address charlie = address(0x33);
    address dave = address(0x44);
    address liquidator = address(0x55);

    function setUp() public {
        tbtc = new MockERC20();
        musd = new MockERC20();
        mezo = new MockERC20();
        priceFeed = new MockPriceFeed(60000 * 1e18); // $60,000 / BTC

        vault = new MezoFlowVault(
            address(tbtc),
            address(musd),
            address(priceFeed),
            address(0),
            address(0),
            address(0),
            address(0)
        );

        stakingBoost = new MezoStakingBoost(address(mezo), address(musd));
        stakingBoost.setVault(address(vault));
        vault.setMezoStakingBoost(address(stakingBoost));

        // Seed liquidity
        musd.mint(address(vault), 1000000 ether);

        // Deal collateral, gas, and MEZO tokens
        address[5] memory users = [alice, bob, charlie, dave, liquidator];
        for (uint256 i = 0; i < users.length; i++) {
            address u = users[i];
            tbtc.mint(u, 100 ether);
            musd.mint(u, 100000 ether);
            mezo.mint(u, 10000 ether);
            vm.deal(u, 100 ether);

            vm.startPrank(u);
            mezo.approve(address(stakingBoost), type(uint256).max);
            musd.approve(address(vault), type(uint256).max);
            tbtc.approve(address(vault), type(uint256).max);
            vm.stopPrank();
        }
    }

    function testStakingTiersTransition() public {
        vm.startPrank(alice);

        // Initially Standard
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Standard));
        assertEq(stakingBoost.getFeeDiscountBps(alice), 0);
        assertEq(stakingBoost.getKeeperBonusBoostBps(alice), 0);

        // Stake 50 MEZO -> Still Standard
        stakingBoost.stake(50 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Standard));

        // Stake 50 more (total 100 MEZO) -> Bronze
        stakingBoost.stake(50 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Bronze));
        assertEq(stakingBoost.getFeeDiscountBps(alice), 1500); // 15% discount
        assertEq(stakingBoost.getKeeperBonusBoostBps(alice), 0);

        // Stake 400 more (total 500 MEZO) -> Silver
        stakingBoost.stake(400 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Silver));
        assertEq(stakingBoost.getFeeDiscountBps(alice), 3000); // 30% discount
        assertEq(stakingBoost.getKeeperBonusBoostBps(alice), 100); // +1.0% keeper boost

        // Stake 2000 more (total 2500 MEZO) -> Gold
        stakingBoost.stake(2000 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Gold));
        assertEq(stakingBoost.getFeeDiscountBps(alice), 5000); // 50% discount
        assertEq(stakingBoost.getKeeperBonusBoostBps(alice), 250); // +2.5% keeper boost

        vm.stopPrank();
    }

    function testUnstakeCooldownEnforced() public {
        vm.startPrank(alice);
        stakingBoost.stake(500 ether);
        assertEq(stakingBoost.stakedBalance(alice), 500 ether);

        uint256 balanceBefore = mezo.balanceOf(alice);

        // Initiate unstake of 200 MEZO
        stakingBoost.initiateUnstake(200 ether);
        assertEq(stakingBoost.stakedBalance(alice), 300 ether);

        // Cooldown is active; claiming should revert
        vm.expectRevert("Cooldown active");
        stakingBoost.claimUnstaked();

        // Warp 1 day (cooldown is 2 days)
        vm.warp(block.timestamp + 1 days);
        vm.expectRevert("Cooldown active");
        stakingBoost.claimUnstaked();

        // Warp remaining 1 day + 1 second
        vm.warp(block.timestamp + 1 days + 1);
        stakingBoost.claimUnstaked();

        assertEq(mezo.balanceOf(alice), balanceBefore + 200 ether);
        vm.stopPrank();
    }

    function testCancelUnstakeRestoresStake() public {
        vm.startPrank(alice);
        stakingBoost.stake(500 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Silver));

        stakingBoost.initiateUnstake(450 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Standard));

        // Cancel unbonding
        stakingBoost.cancelUnstake();
        assertEq(stakingBoost.stakedBalance(alice), 500 ether);
        assertEq(uint256(stakingBoost.getTier(alice)), uint256(MezoStakingBoost.Tier.Silver));

        vm.stopPrank();
    }

    function testVaultBorrowFeeDiscountTiered() public {
        // Configure 1.00% (100 bps) base borrowing fee in vault
        vault.setBaseBorrowingFeeBps(100);

        // Setup tiers
        // Alice: 0 MEZO (Standard -> 0% discount, pays 1.00% = 100 MUSD on 10,000 MUSD borrow)
        // Bob: 100 MEZO (Bronze -> 15% discount, pays 0.85% = 85 MUSD on 10,000 MUSD borrow)
        // Charlie: 500 MEZO (Silver -> 30% discount, pays 0.70% = 70 MUSD on 10,000 MUSD borrow)
        // Dave: 2500 MEZO (Gold -> 50% discount, pays 0.50% = 50 MUSD on 10,000 MUSD borrow)

        vm.prank(bob);
        stakingBoost.stake(100 ether);

        vm.prank(charlie);
        stakingBoost.stake(500 ether);

        vm.prank(dave);
        stakingBoost.stake(2500 ether);

        // Deposit collateral and borrow for each
        address[4] memory borrowers = [alice, bob, charlie, dave];
        uint256[4] memory expectedFees = [
            uint256(100 ether), // Alice: 1.00% of 10,000
            uint256(85 ether),  // Bob: 0.85% of 10,000
            uint256(70 ether),  // Charlie: 0.70% of 10,000
            uint256(50 ether)   // Dave: 0.50% of 10,000
        ];

        for (uint256 i = 0; i < borrowers.length; i++) {
            address b = borrowers[i];
            uint256 expFee = expectedFees[i];

            vm.startPrank(b);
            vault.depositCollateral(2 ether); // $120,000 collateral

            uint256 musdBefore = musd.balanceOf(b);
            vault.borrowMUSD(10000 ether);
            uint256 musdReceived = musd.balanceOf(b) - musdBefore;

            assertEq(musdReceived, 10000 ether - expFee);
            assertEq(vault.borrowedMUSD(b), 10000 ether);
            vm.stopPrank();
        }
    }

    function testKeeperLiquidationBonusBoostApplied() public {
        // Alice borrows maximum MUSD
        vm.startPrank(alice);
        vault.depositCollateral(1 ether); // $60,000 collateral
        vault.borrowMUSD(35000 ether);
        vm.stopPrank();

        // Price drops to $42,000 -> Alice LTV becomes 35000 / 42000 = 83.3% (> 75% liquidation threshold)
        priceFeed.setPrice(42000 * 1e18);
        assertTrue(vault.isLiquidatable(alice));

        // Test Standard Liquidator (0 MEZO staked -> 5.0% bonus = 500 bps)
        // Repaying 10,000 debt:
        // Collateral value with bonus = 10,000 * 1.05 = $10,500
        // Collateral seized = 10,500 / 42,000 = 0.25 tBTC
        uint256 liqBefore = tbtc.balanceOf(liquidator);
        vm.prank(liquidator);
        vault.liquidate(alice, 10000 ether, false);
        uint256 standardSeized = tbtc.balanceOf(liquidator) - liqBefore;
        assertEq(standardSeized, 0.25 ether);

        // Now Gold Liquidator (Dave has 2500 MEZO -> +2.5% boost, total 7.5% bonus = 750 bps)
        // Repaying 10,000 debt:
        // Collateral value with bonus = 10,000 * 1.075 = $10,750
        // Collateral seized = 10,750 / 42,000 = 0.25595238... tBTC
        vm.prank(dave);
        stakingBoost.stake(2500 ether);

        uint256 daveBefore = tbtc.balanceOf(dave);
        vm.prank(dave);
        vault.liquidate(alice, 10000 ether, false);
        uint256 goldSeized = tbtc.balanceOf(dave) - daveBefore;

        uint256 num = uint256(10000 ether) * 10750 * 1e18;
        uint256 den = uint256(10000) * 42000 * 1e18;
        uint256 expectedGoldSeized = num / den;
        assertEq(goldSeized, expectedGoldSeized);
        assertTrue(goldSeized > standardSeized);
    }

    function testProtocolRevenueDividendAccrualAndClaim() public {
        // Alice stakes 500 MEZO (50%), Bob stakes 500 MEZO (50%)
        vm.prank(alice);
        stakingBoost.stake(500 ether);

        vm.prank(bob);
        stakingBoost.stake(500 ether);

        assertEq(stakingBoost.totalStaked(), 1000 ether);

        // Vault charges fees on borrow and deposits 100 MUSD protocol revenue to stakers
        vault.setBaseBorrowingFeeBps(100);

        vm.startPrank(charlie);
        vault.depositCollateral(2 ether);
        vault.borrowMUSD(10000 ether); // 10,000 * 1% = 100 MUSD fee deposited to stakingBoost
        vm.stopPrank();

        // 100 MUSD distributed 50/50 between Alice and Bob
        assertEq(stakingBoost.earned(alice), 50 ether);
        assertEq(stakingBoost.earned(bob), 50 ether);

        // Alice claims her rewards
        uint256 aliceMusdBefore = musd.balanceOf(alice);
        vm.prank(alice);
        uint256 claimed = stakingBoost.claimRewards();
        assertEq(claimed, 50 ether);
        assertEq(musd.balanceOf(alice) - aliceMusdBefore, 50 ether);
        assertEq(stakingBoost.earned(alice), 0);

        // Bob still has 50 MUSD pending
        assertEq(stakingBoost.earned(bob), 50 ether);
    }
}
