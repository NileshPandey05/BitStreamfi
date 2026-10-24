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

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Test Tokens
        TestToken tbtc = new TestToken("Test Bitcoin", "tBTC");
        TestToken musd = new TestToken("Mezo USD", "MUSD");

        // 2. Deploy Core Protocol Contracts
        MezoFlowVault vault = new MezoFlowVault(address(tbtc), address(musd));
        PayrollStreamer streamer = new PayrollStreamer(address(musd));
        SelfRepayingCreditEngine creditEngine = new SelfRepayingCreditEngine(address(vault), address(musd));

        // 3. Seed Vault with MUSD liquidity so borrowers can mint/borrow
        musd.mint(address(vault), 1_000_000 * 10**18);

        // 4. Seed Deployer Wallet with initial tBTC and MUSD
        tbtc.mint(deployer, 50 * 10**18); // 50 tBTC
        musd.mint(deployer, 50_000 * 10**18); // 50,000 MUSD

        console.log("=== DEPLOYMENT COMPLETED ===");
        console.log("Test tBTC:", address(tbtc));
        console.log("Test MUSD:", address(musd));
        console.log("MezoFlowVault:", address(vault));
        console.log("PayrollStreamer:", address(streamer));
        console.log("SelfRepayingCreditEngine:", address(creditEngine));
        console.log("Minted to deployer:", deployer);

        vm.stopBroadcast();
    }
}
