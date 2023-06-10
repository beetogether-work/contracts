// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {ITalentLayerID} from "./interfaces/ITalentLayerID.sol";
import {ITalentLayerService} from "./interfaces/ITalentLayerService.sol";
import {ITalentLayerEscrow} from "./interfaces/ITalentLayerEscrow.sol";

import "hardhat/console.sol";

/**
 * @title Hive
 * @dev This contract is used to manage a group of freelancers (hive). It allows for the creation
 *      of new proposals, reviews, and payments.
 */
contract Hive {
    using Counters for Counters.Counter;

    // Divider used for fees
    uint16 private constant FEE_DIVIDER = 10000;

    // The TalentLayerID contract.
    ITalentLayerID talentLayerId;

    // The TalentLayerService contract.
    ITalentLayerService talentLayerService;

    // The TalentLayerEscrow contract.
    ITalentLayerEscrow talentLayerEscrow;

    address public hiveFactoryAddress;

    // Fee percentage (per 10,000) that goes to the Hive treasury per each transaction
    uint16 public honeyFee;

    // Paymaster address
    address public paymasterAddress;

    // Owner of the group
    address public owner;

    // Uri of the group metadata
    string public dataUri;

    // Members of the group (by TalentLayer ID)
    mapping(uint256 => bool) public members;

    // Proposal request id counter
    Counters.Counter nextProposalRequestId;

    // Proposal requests
    mapping(uint256 => ProposalRequest) public proposalRequests;

    enum ProposalRequestStatus {
        Pending, // Pending to be executed
        Executed // Executed
    }

    struct ProposalRequest {
        uint256 ownerId;
        uint256[] members;
        uint16[] shares;
        uint256 serviceId;
        address rateToken;
        uint256 rateAmount;
        uint256 platformId;
        string dataUri;
        uint256 expirationDate;
        ProposalRequestStatus status;
        uint256 sharedAmount; // Amount of funds that has already been shared
        // bytes signature;
    }

    // =========================== Events ==============================

    /**
     * @dev Emitted when a new user joins the hive.
     */
    event MemberJoined(uint256 hiveId, uint256 userId);

    /**
     * @dev Emitted when a new proposal request is created
     */
    event ProposalRequestCreated(
        uint256 hiveId,
        uint256 indexed id,
        uint256 ownerId,
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

    /**
     * @dev Emitted when a new proposal request is executed
     */
    event ProposalRequestExecuted(uint256 hiveId, uint256 indexed proposalRequestId, uint256 executor);

    /**
     * @dev Emitted when a new proposal request is executed
     * @param proposalRequestId The id of the proposal request
     * @param amount The amount of funds shared
     */
    event FundsShared(uint256 hiveId, uint256 indexed proposalRequestId, uint256 amount);

    /**
     * @dev Emitted when the honey fees are claimed
     */
    event HoneyFeesClaimed(uint256 hiveId, uint256 userId);

    /**
     * @dev Emitted when the data uri is udpated
     */
    event DataUriUpdated(uint256 hiveId, string dataUri);

    // =========================== Modifiers ==============================

    /**
     * @dev Checks that the sender is member of the group.
     */
    modifier onlyMember() {
        // Check if sender is a member
        require(isMember(msg.sender), "Sender is not a member");
        _;
    }

    /**
     * @dev Checks that the sender is member of the group.
     */
    modifier onlyHiveFactory() {
        // Check if sender is a member
        require(msg.sender == hiveFactoryAddress, "Sender is not HiveFactory");
        _;
    }

    // =========================== Constructor ==============================

    /**
     * @param _owner The address of the Hive owner.
     * @param _honeyFee The fee percentage (per 10,000) for the Hive treasury.
     * @param _talentLayerIdAddress The address of the TalentLayerID contract.
     * @param _talentLayerServiceAddress The address of the TalentLayerService contract.
     * @param _talentLayerEscrowAddress The address of the TalentLayerEscrow contract.
     */
    constructor(
        address _owner,
        uint16 _honeyFee,
        address _talentLayerIdAddress,
        address _talentLayerServiceAddress,
        address _talentLayerEscrowAddress
    ) {
        talentLayerId = ITalentLayerID(_talentLayerIdAddress);
        talentLayerService = ITalentLayerService(_talentLayerServiceAddress);
        talentLayerEscrow = ITalentLayerEscrow(_talentLayerEscrowAddress);
        owner = _owner;
        honeyFee = _honeyFee;
        hiveFactoryAddress = msg.sender;

        nextProposalRequestId.increment();

        // Add owner to members
        members[talentLayerId.ids(_owner)] = true;
    }

    // =========================== View functions ==============================

    /**
     * @notice Checks if a given address is member of the hive.
     */
    function isMember(address _address) public view returns (bool) {
        return members[talentLayerId.ids(_address)];
    }

    /**
     * @notice Returns the TalentLayer ID of the hive.
     */
    function hiveId() public view returns (uint256) {
        return talentLayerId.ids(address(this));
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

        emit MemberJoined(hiveId(), userId);
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
    ) public onlyMember {
        // Check members and shares length
        require(_members.length > 0, "Members should be at least one");
        require(_members.length == _shares.length, "Members and shares length mismatch");

        // Check members are valid (are members of the hive)
        for (uint256 i = 0; i < _members.length; i++) {
            require(members[_members[i]], "Member is not a member of the hive");
        }

        // Check shares are valid (sum, including honey fee, is 100%)
        uint256 totalShares = honeyFee;
        for (uint256 i = 0; i < _shares.length; i++) {
            totalShares += _shares[i];
        }
        require(totalShares == FEE_DIVIDER, "Shares sum is not 100%");

        uint256 id = nextProposalRequestId.current();
        proposalRequests[id] = ProposalRequest({
            ownerId: talentLayerId.ids(msg.sender),
            members: _members,
            shares: _shares,
            serviceId: _serviceId,
            rateToken: _rateToken,
            rateAmount: _rateAmount,
            platformId: _platformId,
            dataUri: _dataUri,
            expirationDate: _expirationDate,
            status: ProposalRequestStatus.Pending,
            sharedAmount: 0
            // signature: _signature
        });
        nextProposalRequestId.increment();

        _afterCreateProposalRequest(id);
    }

    /**
     * @notice Executes a proposal request (creates the proposal on TalentLayerService)
     */
    function executeProposalRequest(uint256 _proposalRequestId) public onlyMember {
        ProposalRequest memory proposalRequest = proposalRequests[_proposalRequestId];

        uint256 senderId = talentLayerId.ids(msg.sender);
        require(senderId != proposalRequest.ownerId, "Owner cannot execute its own proposal request");
        require(members[senderId], "Sender is not a member");

        // Check proposal request is pending
        require(proposalRequest.status == ProposalRequestStatus.Pending, "Proposal request is not pending");

        // Create proposal
        talentLayerService.createProposal(
            hiveId(),
            proposalRequest.serviceId,
            proposalRequest.rateToken,
            proposalRequest.rateAmount,
            proposalRequest.platformId,
            proposalRequest.dataUri,
            proposalRequest.expirationDate,
            ""
        );

        // Mark proposal request as executed
        proposalRequests[_proposalRequestId].status = ProposalRequestStatus.Executed;

        emit ProposalRequestExecuted(hiveId(), _proposalRequestId, senderId);
    }

    /**
     * @notice Shares the funds of a proposal request.
     */
    function shareFunds(uint256 _proposalRequestId) public payable {
        ProposalRequest memory proposalRequest = proposalRequests[_proposalRequestId];

        ITalentLayerService.Service memory service = talentLayerService.getService(proposalRequest.serviceId);
        ITalentLayerEscrow.Transaction memory transaction = talentLayerEscrow.getTransactionDetails(
            service.transactionId
        );
        uint256 amountToShare = transaction.releasedAmount - proposalRequest.sharedAmount;
        require(amountToShare > 0, "No funds to share");

        // Share funds between all the members of the proposal request, based on the shares
        for (uint256 i = 0; i < proposalRequest.members.length; i++) {
            uint256 share = (amountToShare * proposalRequest.shares[i]) / FEE_DIVIDER;
            address memberAddress = talentLayerId.ownerOf(proposalRequest.members[i]);
            _transferBalance(memberAddress, transaction.token, share);
        }

        // Update shared amount
        proposalRequests[_proposalRequestId].sharedAmount += amountToShare;

        emit FundsShared(hiveId(), _proposalRequestId, amountToShare);
    }

    /**
     * @notice Claims the honey fees of a given token. For now the fees can be claimed by any
     *         member of the group. In the future, there will be a governance process to decide what to do with the fees.
     */
    function claimHoneyFees(address _tokenAddress) public onlyMember {
        if (_tokenAddress == address(0)) {
            _transferBalance(msg.sender, _tokenAddress, address(this).balance);
        } else {
            uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
            _transferBalance(msg.sender, _tokenAddress, balance);
        }

        emit HoneyFeesClaimed(hiveId(), talentLayerId.ids(msg.sender));
    }

    /**
     * @notice Updates the data URI of the hive.
     */
    function updateDataUri(string memory _dataUri) public onlyMember {
        require(bytes(_dataUri).length == 46, "Invalid cid");
        dataUri = _dataUri;

        emit DataUriUpdated(hiveId(), _dataUri);
    }

    // =========================== HiveFactory functions ==============================

    /**
     * Sets
     */
    function setPaymaster(address _paymasterAddress) public onlyHiveFactory {
        paymasterAddress = _paymasterAddress;
    }

    // =========================== Receive function ==============================

    receive() external payable {}

    // =========================== Internal functions ==============================

    function _afterCreateProposalRequest(uint256 _proposalRequestId) internal {
        ProposalRequest storage proposalRequest = proposalRequests[_proposalRequestId];

        emit ProposalRequestCreated(
            hiveId(),
            _proposalRequestId,
            proposalRequest.ownerId,
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

    /**
     * @notice Transfers a token or ETH balance from the escrow to a recipient's address.
     * @param _recipient The address to transfer the balance to
     * @param _tokenAddress The token address, or zero address for ETH
     * @param _amount The amount to transfer
     */
    function _transferBalance(address _recipient, address _tokenAddress, uint256 _amount) private {
        if (address(0) == _tokenAddress) {
            (bool success, ) = payable(_recipient).call{value: _amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(_tokenAddress).transfer(_recipient, _amount);
        }
    }
}
