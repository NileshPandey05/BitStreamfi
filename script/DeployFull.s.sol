// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MezoFlowVault.sol";
import "../src/PayrollStreamer.sol";
import "../src/SelfRepayingCreditEngine.sol";
import "../src/TestTokens.sol";

contract DeployFullScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey != 0 ? vm.addr(deployerPrivateKey) : msg.sender;

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        // 1. Deploy Real Test tBTC Token (with public faucet and mint)
        TestToken tbtc = new TestToken("Test Bitcoin", "tBTC");

        // 2. Official Mezo Testnet Contract Addresses
        address musd = vm.envOr("MUSD_ADDRESS", address(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503));
        address priceFeed = vm.envOr("PRICE_FEED_ADDRESS", address(0x86bCF0841622a5dAC14A313a15f96A95421b9366));
        address borrowerOps = vm.envOr("BORROWER_OPS_ADDRESS", address(0xCdF7028ceAB81fA0C6971208e83fa7872994beE5));
        address troveManager = vm.envOr("TROVE_MANAGER_ADDRESS", address(0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0));
        address hintHelpers = vm.envOr("HINT_HELPERS_ADDRESS", address(0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6));
        address sortedTroves = vm.envOr("SORTED_TROVES_ADDRESS", address(0x722E4D24FD6Ff8b0AC679450F3D91294607268fA));

        // 3. Deploy Core Protocol Contracts
        MezoFlowVault vault = new MezoFlowVault(
            address(tbtc),
            musd,
            priceFeed,
            borrowerOps,
            troveManager,
            hintHelpers,
            sortedTroves
        );
        PayrollStreamer streamer = new PayrollStreamer(musd);
        SelfRepayingCreditEngine creditEngine = new SelfRepayingCreditEngine(address(vault), musd);

        // 4. Seed Deployer Wallet with initial tBTC so users can test immediately
        tbtc.mint(deployer, 50 * 10**18); // 50 tBTC

        console.log("=== FULL PROTOCOL DEPLOYMENT COMPLETED ===");
        console.log("Test tBTC Token:", address(tbtc));
        console.log("MUSD Stablecoin:", musd);
        console.log("PriceFeed:", priceFeed);
        console.log("BorrowerOperations:", borrowerOps);
        console.log("MezoFlowVault:", address(vault));
        console.log("PayrollStreamer:", address(streamer));
        console.log("SelfRepayingCreditEngine:", address(creditEngine));
        console.log("Minted 50 tBTC to deployer:", deployer);

        vm.stopBroadcast();
    }
}
