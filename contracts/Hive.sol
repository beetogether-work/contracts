// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";

import "hardhat/console.sol";

/**
 * @title Hive
 * @dev This contract is used to manage a group of freelancers (hive). It allows for the creation
 *      of new proposals, reviews, and payments.
 */
contract Hive {
    ITalentLayerID talentLayerId;

    address public owner;

    mapping(uint256 => bool) members;

    // =========================== Constructor ==============================

    /**
     * @param _talentLayerIdAddress The address of the TalentLayerID contract.
     * @param _owner The address of the Hive owner.
     */
    constructor(address _talentLayerIdAddress, address _owner) {
        talentLayerId = ITalentLayerID(_talentLayerIdAddress);

        owner = _owner;
    }

    // =========================== User functions ==============================

    /**
     * @notice Joins the hive. Mints a TalentLayer ID to the sender if doesn't have one yet.
     * @param _ownerSignature signature of the hive owner to allow the operation
     * @param _platformId The id of the TalentLayer platform for minting the TalentLayer ID.
     * @param _handle The handle of the user for minting its TalentLayer ID. Should be empty if already has a TalentLayer ID.
     */
    function join(bytes calldata _ownerSignature, uint256 _platformId, string memory _handle) public payable {
        _validateOwnerSignature(_ownerSignature);

        // Mint TalentLayer ID to sender if doesn't have it
        uint256 ownerId = talentLayerId.ids(msg.sender);
        if (ownerId == 0) {
            ownerId = talentLayerId.mintForAddress(msg.sender, _platformId, _handle);
        }
    }

    // =========================== Private functions ==============================

    /**
     * @notice Validate the owner ECDSA signature for a given message hash operation
     * @param _signature platform signature to allow the operation
     */
    function _validateOwnerSignature(bytes calldata _signature) private view {
        bytes32 messageHash = keccak256(abi.encodePacked("join", address(this)));
        bytes32 ethMessageHash = ECDSA.toEthSignedMessageHash(messageHash);

        address signer = ECDSA.recover(ethMessageHash, _signature);
        require(owner == signer, "Invalid signature");
    }
}
