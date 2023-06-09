// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Hive} from "./Hive.sol";
import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";

/**
 * @title HiveFactory
 * @dev This contract is used to create new Hive (group) contracts.
 */
contract HiveFactory {
    ITalentLayerID talentLayerId;

    // =========================== Constructor ==============================

    /**
     * @param talentLayerIdAddress The address of the TalentLayerID contract.
     */
    constructor(address talentLayerIdAddress) {
        talentLayerId = ITalentLayerID(talentLayerIdAddress);
    }

    // =========================== User functions ==============================

    /**
     * Creates a new Hive (group) contract.
     * @param dataUri The uri of the hive metadata.
     */
    function createHive(string memory dataUri) public {
        // deploy new Hive contract
        Hive hive = new Hive(address(talentLayerId), dataUri, msg.sender);
    }
}
