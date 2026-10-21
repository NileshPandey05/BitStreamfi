// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MezoFlowVault.sol";
import "../src/PayrollStreamer.sol";
import "../src/SelfRepayingCreditEngine.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(1));
        vm.startBroadcast(deployerPrivateKey);

        address tbtc = vm.envOr("TBTC_ADDRESS", address(0x1234567890123456789012345678901234567890));
        address musd = vm.envOr("MUSD_ADDRESS", address(0x0987654321098765432109876543210987654321));

        MezoFlowVault vault = new MezoFlowVault(tbtc, musd);
        PayrollStreamer streamer = new PayrollStreamer(musd);
        SelfRepayingCreditEngine creditEngine = new SelfRepayingCreditEngine(address(vault), musd);

        console.log("MezoFlowVault deployed at:", address(vault));
        console.log("PayrollStreamer deployed at:", address(streamer));
        console.log("SelfRepayingCreditEngine deployed at:", address(creditEngine));

        vm.stopBroadcast();
    }
}
