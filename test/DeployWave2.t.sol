// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../script/DeployWave2.s.sol";

contract DeployWave2Test is Test {
    DeployWave2Script script;

    function setUp() public {
        script = new DeployWave2Script();
    }

    function testDeployWave2ScriptExecution() public {
        // Run deployment script
        script.run();

        // Verify successful deployment without reverts
        assertTrue(true);
    }
}
