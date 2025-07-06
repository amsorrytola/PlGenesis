// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/dNEAR.sol";

contract Deploy is Script {

        string constant mintSourceCode = "./functions/sources/alpacaMint.js";
        string constant redeemSourceCode = "./functions/sources/alpacaRedeem.js";
        uint64 subId = 5279;
        uint64 secretVersion = 1751798734;
        uint8 secretSlot = 0; 
        
       function run() external {

        string memory mintSource = vm.readFile(mintSourceCode);
        string memory redeemSource = vm.readFile(redeemSourceCode);

        vm.startBroadcast();

        dNEAR dNEARContract = new dNEAR(
            mintSource,
            redeemSource,
            subId,
            secretVersion,
            secretSlot
        );

        console.log("dNEAR contract deployed at:", address(dNEARContract));

        vm.stopBroadcast();
    }
}