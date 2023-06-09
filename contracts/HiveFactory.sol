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

    // =========================== Events ==============================

    event HiveCreated(address hiveAddress);

    // =========================== Constructor ==============================

    /**
     * @param _talentLayerIdAddress The address of the TalentLayerID contract.
     */
    constructor(address _talentLayerIdAddress) {
        talentLayerId = ITalentLayerID(_talentLayerIdAddress);
    }

    // =========================== User functions ==============================

    /**
     * Creates a new Hive (group) contract.
     * @param _platformId The id of the TalentLayer platform for minting the Hive TalentLayer ID
     *                    and sender TalentLayer ID if required.
     * @param _groupHandle The handle of the group.
     * @param _ownerHandle The handle of the Hive owner. Should be empty if owner already has a TalentLayer ID.
     */
    function createHive(uint256 _platformId, string memory _groupHandle, string memory _ownerHandle) public payable {
        // Mint TalentLayer ID to sender if doesn't have it
        uint256 ownerId = talentLayerId.ids(msg.sender);
        if (ownerId == 0) {
            ownerId = talentLayerId.mintForAddress(msg.sender, _platformId, _ownerHandle);
        }

        // Deploy new Hive contract
        Hive hive = new Hive(address(talentLayerId), msg.sender);

        // Mint TalentLayer ID to Hive
        talentLayerId.mintForAddress(address(hive), _platformId, _groupHandle);

        emit HiveCreated(address(hive));
    }
}
