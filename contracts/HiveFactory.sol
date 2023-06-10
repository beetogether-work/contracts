// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {Hive} from "./Hive.sol";
import {HivePaymaster} from "./HivePaymaster.sol";
import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";
import {ITalentLayerService} from "./interfaces/ITalentLayerService.sol";
import {ITalentLayerEscrow} from "./interfaces/ITalentLayerEscrow.sol";

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

    // The TalentLayerEscrow contract.
    ITalentLayerEscrow talentLayerEscrow;

    // =========================== Events ==============================

    event HiveCreated(uint256 id, address hiveAddress, uint256 ownerId, uint16 honeyFee, address paymasterAddress);

    // =========================== Constructor ==============================

    /**
     * @param _talentLayerIdAddress The address of the TalentLayerID contract.
     * @param _talentLayerServiceAddress The address of the TalentLayerService contract.
     * @param _talentLayerEscrowAddress The address of the TalentLayerEscrow contract.
     */
    constructor(address _talentLayerIdAddress, address _talentLayerServiceAddress, address _talentLayerEscrowAddress) {
        talentLayerId = ITalentLayerID(_talentLayerIdAddress);
        talentLayerService = ITalentLayerService(_talentLayerServiceAddress);
        talentLayerEscrow = ITalentLayerEscrow(_talentLayerEscrowAddress);
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
        Hive hive = new Hive(
            msg.sender,
            _honeyFee,
            address(talentLayerId),
            address(talentLayerService),
            address(talentLayerEscrow)
        );

        // Mint TalentLayer ID to Hive
        uint256 hiveId = _mintTlId(address(hive), _platformId, _groupHandle, ownerId == 0 ? msg.value / 2 : msg.value);

        // Deploy new Paymaster contract and set it to the Hive
        // TODO: Do this only if the chain is zkSync
        HivePaymaster paymaster = new HivePaymaster(address(hive), address(talentLayerId));
        hive.setPaymaster(address(paymaster));

        emit HiveCreated(hiveId, address(hive), ownerId, _honeyFee, address(paymaster));

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
