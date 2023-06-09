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

        console.log("Owner");
        console.log(_owner);

        owner = _owner;
    }

    // =========================== User functions ==============================

    function join(bytes calldata _ownerSignature) public payable {
        _validateOwnerSignature(_ownerSignature);
    }

    // =========================== Private functions ==============================

    /**
     * @notice Validate the owner ECDSA signature for a given message hash operation
     * @param _signature platform signature to allow the operation
     */
    function _validateOwnerSignature(bytes calldata _signature) private view {
        bytes32 messageHash = keccak256(abi.encodePacked("join"));
        bytes32 ethMessageHash = ECDSA.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethMessageHash, _signature);
        require(owner == signer, "Invalid signature");
    }
}
