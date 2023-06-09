// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Hive} from "./Hive.sol";
import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";
import {ITalentLayerService} from "./interfaces/ITalentLayerService.sol";

import "hardhat/console.sol";

/**
 * @title HiveFactory
 * @dev This contract is used to create new Hive (group) contracts.
 */
contract HiveFactory {
    // The TalentLayerID contract.
    ITalentLayerID talentLayerId;

    // The TalentLayerService contract.
    ITalentLayerService talentLayerService;

    // =========================== Events ==============================

    event HiveCreated(address hiveAddress);

    // =========================== Constructor ==============================

    /**
     * @param _talentLayerIdAddress The address of the TalentLayerID contract.
     * @param _talentLayerServiceAddress The address of the TalentLayerService contract.
     */
    constructor(address _talentLayerIdAddress, address _talentLayerServiceAddress) {
        talentLayerId = ITalentLayerID(_talentLayerIdAddress);
        talentLayerService = ITalentLayerService(_talentLayerServiceAddress);
    }

    // =========================== User functions ==============================

    /**
     * Creates a new Hive (group) contract.
     * @param _platformId The id of the TalentLayer platform for minting the Hive TalentLayer ID
     *                    and sender TalentLayer ID if required.
     * @param _groupHandle The handle of the group.
     * @param _ownerHandle The handle of the Hive owner. Should be empty if owner already has a TalentLayer ID.
     * @param _honeyFee The fee percentage (per 10,000) for the Hive treasury.
     */
    function createHive(
        uint256 _platformId,
        string memory _groupHandle,
        string memory _ownerHandle,
        uint16 _honeyFee
    ) public payable returns (uint256) {
        // Mint TalentLayer ID to sender if doesn't have it
        uint256 ownerId = talentLayerId.ids(msg.sender);
        if (ownerId == 0) {
            ownerId = _mintTlId(msg.sender, _platformId, _ownerHandle, msg.value / 2);
        }

        // Deploy new Hive contract
        Hive hive = new Hive(msg.sender, _honeyFee, address(talentLayerId), address(talentLayerService));

        // Mint TalentLayer ID to Hive
        uint256 hiveId = _mintTlId(address(hive), _platformId, _groupHandle, msg.value / 2);

        emit HiveCreated(address(hive));

        return hiveId;
    }

    // =========================== Private functions ==============================

    /**
     * @notice Mint a TalentLayer ID to a given address.
     */
    function _mintTlId(
        address _address,
        uint256 _platformId,
        string memory _handle,
        uint256 _price
    ) public payable returns (uint256) {
        (bool success, bytes memory data) = address(talentLayerId).call{value: _price}(
            abi.encodeWithSignature("mintForAddress(address,uint256,string)", _address, _platformId, _handle)
        );
        require(success, "Minting failed");

        return abi.decode(data, (uint256));
    }
}
