// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";

/**
 * @title Hive
 * @dev This contract is used to manage a group of freelancers (hive). It allows for the creation
 *      of new proposals, reviews, and payments.
 */
contract Hive {
    ITalentLayerID talentLayerId;

    mapping(uint256 => bool) members;

    // =========================== Constructor ==============================

    /**
     * @param talentLayerIdAddress The address of the TalentLayerID contract.
     */
    constructor(address talentLayerIdAddress, string memory dataUri, address owner) {
        talentLayerId = ITalentLayerID(talentLayerIdAddress);
    }
}
