// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MezoFlowVault.sol";
import "../src/PayrollStreamer.sol";
import "../src/MezoStakingBoost.sol";
import "../src/SelfRepayingCreditEngine.sol";
import "../src/TestTokens.sol";

contract DeployWave2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey != 0 ? vm.addr(deployerPrivateKey) : msg.sender;

        if (deployerPrivateKey != 0) {
            vm.startBroadcast(deployerPrivateKey);
        } else {
            vm.startBroadcast();
        }

        // 1. Official Mezo Testnet Contract Addresses
        address tbtc = vm.envOr("TBTC_ADDRESS", address(0xd82C1e865efD488Fd0C9AA3276D236Eae3fD77Ae));
        address musd = vm.envOr("MUSD_ADDRESS", address(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503));
        address mezo = vm.envOr("MEZO_ADDRESS", address(0x7B7c000000000000000000000000000000000001));
        address priceFeed = vm.envOr("PRICE_FEED_ADDRESS", address(0x86bCF0841622a5dAC14A313a15f96A95421b9366));
        address borrowerOps = vm.envOr("BORROWER_OPS_ADDRESS", address(0xCdF7028ceAB81fA0C6971208e83fa7872994beE5));
        address troveManager = vm.envOr("TROVE_MANAGER_ADDRESS", address(0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0));
        address hintHelpers = vm.envOr("HINT_HELPERS_ADDRESS", address(0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6));
        address sortedTroves = vm.envOr("SORTED_TROVES_ADDRESS", address(0x722E4D24FD6Ff8b0AC679450F3D91294607268fA));

        // 2. Deploy Core Protocol Vault
        MezoFlowVault vault = new MezoFlowVault(
            tbtc,
            musd,
            priceFeed,
            borrowerOps,
            troveManager,
            hintHelpers,
            sortedTroves
        );

        // 3. Deploy Wave 2 Payroll Streamer
        PayrollStreamer streamer = new PayrollStreamer(musd);

        // 4. Deploy Wave 2 MEZO Governance Staking Boost
        MezoStakingBoost stakingBoost = new MezoStakingBoost(mezo, musd);

        // 5. Deploy Credit Engine
        SelfRepayingCreditEngine creditEngine = new SelfRepayingCreditEngine(address(vault), musd);

        // 6. Connect Closed-Loop Cross-Contract Links
        vault.setPayrollStreamer(address(streamer));
        vault.setMezoStakingBoost(address(stakingBoost));
        vault.setBaseBorrowingFeeBps(50); // 0.50% base borrowing fee

        streamer.setVault(address(vault));
        stakingBoost.setVault(address(vault));

        console.log("=== WAVE 2 FULL PROTOCOL DEPLOYMENT COMPLETED ===");
        console.log("Deployer:", deployer);
        console.log("MezoFlowVault:", address(vault));
        console.log("PayrollStreamer:", address(streamer));
        console.log("MezoStakingBoost:", address(stakingBoost));
        console.log("SelfRepayingCreditEngine:", address(creditEngine));
        console.log("Official tBTC Token:", tbtc);
        console.log("Official MUSD Token:", musd);
        console.log("Official MEZO Token:", mezo);
        console.log("PriceFeed Oracle:", priceFeed);
        console.log("BorrowerOperations:", borrowerOps);

        vm.stopBroadcast();
    }
}
