// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Hive} from "./Hive.sol";
import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";

import "hardhat/console.sol";

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
            _mintTlId(msg.sender, _platformId, _ownerHandle, msg.value / 2);
        }

        // Deploy new Hive contract
        Hive hive = new Hive(address(talentLayerId), msg.sender);

        // Mint TalentLayer ID to Hive
        _mintTlId(address(hive), _platformId, _groupHandle, msg.value / 2);

        emit HiveCreated(address(hive));
    }

    // =========================== Private functions ==============================

    /**
     * @notice Mint a TalentLayer ID to a given address.
     */
    function _mintTlId(address _address, uint256 _platformId, string memory _handle, uint256 _price) public payable {
        (bool success, ) = address(talentLayerId).call{value: _price}(
            abi.encodeWithSignature("mintForAddress(address,uint256,string)", _address, _platformId, _handle)
        );
        require(success, "Minting failed");
    }
}
