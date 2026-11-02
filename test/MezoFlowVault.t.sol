// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MezoFlowVault.sol";

contract MockPriceFeed is IPriceFeed {
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

contract MezoFlowVaultTest is Test {
    MezoFlowVault vault;
    MockPriceFeed priceFeed;
    MockERC20 tbtc;
    MockERC20 musd;

    address alice = address(0x1);
    address bob = address(0x2);
    address liquidator = address(0x3);

    function setUp() public {
        tbtc = new MockERC20();
        musd = new MockERC20();
        // Initial price: $60,000 per BTC (in 18 decimals)
        priceFeed = new MockPriceFeed(60000 * 1e18);

        vault = new MezoFlowVault(
            address(tbtc),
            address(musd),
            address(priceFeed),
            address(0),
            address(0),
            address(0),
            address(0)
        );

        tbtc.mint(alice, 10 ether);
        tbtc.mint(bob, 10 ether);
        musd.mint(address(vault), 1000000 ether);
        musd.mint(alice, 10000 ether);
        musd.mint(liquidator, 100000 ether);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(liquidator, 10 ether);
        vm.deal(address(vault), 10 ether);
    }

    function testDynamicPriceFeedIntegration() public {
        assertEq(vault.getBTCPrice(), 60000 * 1e18);

        // Price updates to $78,000
        priceFeed.setPrice(78000 * 1e18);
        assertEq(vault.getBTCPrice(), 78000 * 1e18);

        // Deposit 1 tBTC
        vm.startPrank(alice);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether);

        // Value of 1 tBTC at $78,000 = $78,000 USD
        assertEq(vault.getCollateralValueUSD(alice), 78000 * 1e18);

        // Max borrow at 60% LTV = $46,800 MUSD
        assertEq(vault.getMaxBorrow(alice), 46800 * 1e18);
        vm.stopPrank();
    }

    function testNativeCollateralSeparation() public {
        vm.startPrank(alice);
        vault.depositNativeCollateral{value: 1 ether}();
        assertEq(vault.nativeCollateralBalances(alice), 1 ether);
        assertEq(vault.tbtcCollateralBalances(alice), 0);
        assertEq(vault.collateralBalances(alice), 1 ether);

        // Withdraw 0.5 native BTC
        vault.withdrawCollateral(0.5 ether, true);
        assertEq(vault.nativeCollateralBalances(alice), 0.5 ether);

        // Attempting to withdraw tBTC should revert
        vm.expectRevert("Insufficient tBTC collateral");
        vault.withdrawCollateral(0.1 ether, false);
        vm.stopPrank();
    }

    function testBorrowAndRepayFlow() public {
        vm.startPrank(alice);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether);

        // Borrow 20,000 MUSD (within 60% of $60,000 = $36,000)
        vault.borrowMUSD(20000 ether);
        assertEq(vault.borrowedMUSD(alice), 20000 ether);
        assertEq(musd.balanceOf(alice), 30000 ether);

        // Repay 5,000 MUSD
        musd.approve(address(vault), 5000 ether);
        vault.repayMUSD(5000 ether);
        assertEq(vault.borrowedMUSD(alice), 15000 ether);
        vm.stopPrank();
    }

    function testBorrowExceedsMaxLTVReverts() public {
        vm.startPrank(alice);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether); // 1 BTC = $60,000 => max borrow $36,000

        vm.expectRevert("Exceeds max LTV");
        vault.borrowMUSD(36001 ether);
        vm.stopPrank();
    }

    function testWithdrawCollateralUndercollateralizedReverts() public {
        vm.startPrank(alice);
        tbtc.approve(address(vault), 2 ether);
        vault.depositCollateral(2 ether); // $120,000
        vault.borrowMUSD(50000 ether); // $50,000 debt

        // Withdrawing 1 ether leaves 1 ether ($60,000 max borrow $36,000 < $50,000 debt) -> revert
        vm.expectRevert("Position would be undercollateralized");
        vault.withdrawCollateral(1 ether, false);

        // Withdrawing 0.5 ether leaves 1.5 ether ($90,000 max borrow $54,000 >= $50,000 debt) -> pass
        vault.withdrawCollateral(0.5 ether, false);
        assertEq(vault.collateralBalances(alice), 1.5 ether);
        vm.stopPrank();
    }

    function testLiquidationWhenPriceDrops() public {
        // High severity fix test: liquidation mechanism
        vm.startPrank(alice);
        tbtc.approve(address(vault), 1 ether);
        vault.depositCollateral(1 ether); // 1 tBTC at $60,000
        vault.borrowMUSD(36000 ether); // 60% LTV borrow
        vm.stopPrank();

        // Not liquidatable at $60,000 (debt 36,000 <= 75% of 60,000 = 45,000)
        assertFalse(vault.isLiquidatable(alice));

        // Price drops to $40,000 per BTC!
        // At $40,000, 75% liquidation threshold is $30,000.
        // Debt is $36,000 > $30,000 => alice IS NOW LIQUIDATABLE!
        priceFeed.setPrice(40000 * 1e18);
        assertTrue(vault.isLiquidatable(alice));

        // Liquidator repays 10,000 MUSD of Alice's debt
        vm.startPrank(liquidator);
        musd.approve(address(vault), 10000 ether);

        uint256 liquidatorTbtcBefore = tbtc.balanceOf(liquidator);
        vault.liquidate(alice, 10000 ether, false);

        // Alice debt reduced
        assertEq(vault.borrowedMUSD(alice), 26000 ether);

        // Liquidator received collateral with 5% bonus:
        // collateralSeized = (10,000 * 1.05) / 40,000 = 0.2625 tBTC
        uint256 tbtcReceived = tbtc.balanceOf(liquidator) - liquidatorTbtcBefore;
        assertEq(tbtcReceived, (10000 ether * 10500) / 10000 * 1e18 / (40000 * 1e18));
        assertEq(tbtcReceived, 0.2625 ether);
        vm.stopPrank();
    }

    function testLiquidateNativeCollateral() public {
        vm.startPrank(bob);
        vault.depositNativeCollateral{value: 1 ether}();
        vault.borrowMUSD(36000 ether);
        vm.stopPrank();

        // Price drops to $40,000
        priceFeed.setPrice(40000 * 1e18);
        assertTrue(vault.isLiquidatable(bob));

        vm.startPrank(liquidator);
        musd.approve(address(vault), 20000 ether);
        uint256 liquidatorNativeBefore = liquidator.balance;

        vault.liquidate(bob, 20000 ether, true);
        assertEq(vault.borrowedMUSD(bob), 16000 ether);

        // Liquidator received native BTC with 5% bonus
        uint256 nativeReceived = liquidator.balance - liquidatorNativeBefore;
        assertEq(nativeReceived, 0.525 ether); // (20,000 * 1.05) / 40,000 = 0.525 BTC
        vm.stopPrank();
    }
}
