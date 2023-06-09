// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";
import {ITalentLayerService} from "./interfaces/ITalentLayerService.sol";

import "hardhat/console.sol";

/**
 * @title Hive
 * @dev This contract is used to manage a group of freelancers (hive). It allows for the creation
 *      of new proposals, reviews, and payments.
 */
contract Hive {
    using Counters for Counters.Counter;

    // The TalentLayerID contract.
    ITalentLayerID talentLayerId;

    // The TalentLayerService contract.
    ITalentLayerService talentLayerService;

    address public owner;

    mapping(uint256 => bool) public members;

    // Proposal request id counter
    Counters.Counter nextProposalRequestId;

    mapping(uint256 => ProposalRequest) public proposalRequests;

    struct ProposalRequest {
        uint256[] members;
        uint16[] shares;
        uint256 serviceId;
        address rateToken;
        uint256 rateAmount;
        uint256 platformId;
        string dataUri;
        uint256 expirationDate;
        // bytes signature;
    }

    // =========================== Events ==============================

    /**
     * @dev Emitted when a new proposal request is created
     */
    event ProposalRequestCreated(
        uint256 indexed id,
        uint256[] members,
        uint16[] shares,
        uint256 serviceId,
        address rateToken,
        uint256 rateAmount,
        uint256 platformId,
        string dataUri,
        uint256 expirationDate
        // bytes signature
    );

    // =========================== Constructor ==============================

    /**
     * @param _talentLayerIdAddress The address of the TalentLayerID contract.
     * @param _talentLayerServiceAddress The address of the TalentLayerService contract.
     * @param _owner The address of the Hive owner.
     */
    constructor(address _owner, address _talentLayerIdAddress, address _talentLayerServiceAddress) {
        talentLayerId = ITalentLayerID(_talentLayerIdAddress);
        talentLayerService = ITalentLayerService(_talentLayerServiceAddress);
        owner = _owner;

        nextProposalRequestId.increment();
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
        uint256 userId = talentLayerId.ids(msg.sender);
        if (userId == 0) {
            userId = _mintTlId(msg.sender, _platformId, _handle);
        }

        // Add to members
        members[userId] = true;
    }

    /**
     * @notice Creates a new proposal request.
     */
    function createProposalRequest(
        uint256 _serviceId,
        address _rateToken,
        uint256 _rateAmount,
        uint256 _platformId,
        string calldata _dataUri,
        uint256 _expirationDate,
        // bytes calldata _signature,
        uint256[] calldata _members,
        uint16[] calldata _shares
    ) public {
        // Check if sender is a member
        uint256 senderId = talentLayerId.ids(msg.sender);
        require(members[senderId], "Sender is not a member");

        // TODO: check members and shares length

        // TODO: check members are valid (are members of the hive)

        // TODO: check shares are valid (sum is 100%)

        uint256 id = nextProposalRequestId.current();
        proposalRequests[id] = ProposalRequest({
            members: _members,
            shares: _shares,
            serviceId: _serviceId,
            rateToken: _rateToken,
            rateAmount: _rateAmount,
            platformId: _platformId,
            dataUri: _dataUri,
            expirationDate: _expirationDate
            // signature: _signature
        });
        nextProposalRequestId.increment();

        _afterCreateProposalRequest(id);
    }

    // =========================== Internal functions ==============================

    function _afterCreateProposalRequest(uint256 _proposalRequestId) internal {
        ProposalRequest storage proposalRequest = proposalRequests[_proposalRequestId];

        emit ProposalRequestCreated(
            _proposalRequestId,
            proposalRequest.members,
            proposalRequest.shares,
            proposalRequest.serviceId,
            proposalRequest.rateToken,
            proposalRequest.rateAmount,
            proposalRequest.platformId,
            proposalRequest.dataUri,
            proposalRequest.expirationDate
            // proposalRequest.signature
        );
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

    /**
     * @notice Mint a TalentLayer ID to a given address.
     */
    function _mintTlId(address _address, uint256 _platformId, string memory _handle) public payable returns (uint256) {
        (bool success, bytes memory data) = address(talentLayerId).call{value: msg.value}(
            abi.encodeWithSignature("mintForAddress(address,uint256,string)", _address, _platformId, _handle)
        );
        require(success, "Minting failed");

        return abi.decode(data, (uint256));
    }
}
