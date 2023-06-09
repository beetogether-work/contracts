import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { Hive, HiveFactory, TalentLayerID } from '../typechain-types';
import { deploy } from '../utils/deploy';
import { expect } from 'chai';
import {
  TalentLayerPlatformID,
  TalentLayerService,
} from '../typechain-types/contracts/tests/talentlayer';
import { ETH_ADDRESS, MintStatus, ProposalRequestStatus } from '../utils/constants';
import { ContractTransaction } from 'ethers';
import { getSignature } from '../utils/signature';

describe('HiveFactory', () => {
  let deployer: SignerWithAddress,
    platformOwner: SignerWithAddress,
    groupOwner: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    dave: SignerWithAddress,
    talentLayerID: TalentLayerID,
    talentLayerPlatformID: TalentLayerPlatformID,
    talentLayerService: TalentLayerService,
    hiveAddress: string,
    hiveFactory: HiveFactory,
    hive: Hive;

  const daveTlId = 1;
  const groupOwnerTlId = 2;
  const hiveTlId = 3;
  const bobTlId = 4;
  // const carolTlId = 5;

  const platformId = 1;
  const mintFee = 100;
  const serviceId = 1;
  const honeyFee = 1000;
  const proposalRequestId = 1;
  // const proposalId = 1;
  const proposalToken = ETH_ADDRESS;
  const proposalAmount = 1000;
  const proposalDataUri = 'QmNSARUuUMHkFcnSzrCAhmZkmQu7ViK18sPkg48xnbAmv4';
  const now = Math.floor(Date.now() / 1000);
  const proposalExpirationDate = now + 60 * 60 * 24 * 15;

  before(async () => {
    [deployer, platformOwner, groupOwner, bob, carol, dave] = await ethers.getSigners();
    [hiveFactory, talentLayerID, talentLayerPlatformID, talentLayerService] = await deploy();

    // Disable whitelist for reserved handles
    await talentLayerID.connect(deployer).updateMintStatus(MintStatus.PUBLIC);
    await talentLayerID.connect(deployer).updateMintFee(mintFee);

    // Whitelist a list of authorized tokens

    const allowedTokenList = [ETH_ADDRESS];
    const minTokenWhitelistTransactionAmount = 10;
    for (const tokenAddress of allowedTokenList) {
      await talentLayerService
        .connect(deployer)
        .updateAllowedTokenList(tokenAddress, true, minTokenWhitelistTransactionAmount);
    }

    // Set service contract address on ID contract
    await talentLayerID.connect(deployer).setIsServiceContract(talentLayerService.address, true);

    // Dave mints a TalentLayer ID
    await talentLayerID.connect(dave).mint(0, 'dave_', {
      value: mintFee,
    });

    // Create PlatformId
    await talentLayerPlatformID.connect(deployer).whitelistUser(platformOwner.address);
    await talentLayerPlatformID.connect(platformOwner).mint('bee-together');

    // Dave creates a service
    const serviceDataUri = 'QmNSARUuUMHkFcnSzrCAhmZkmQu7ViK18sPkg48xnbAmv3';
    await talentLayerService.connect(dave).createService(daveTlId, platformId, serviceDataUri, []);
  });

  describe('Create Hive', async () => {
    let tx: ContractTransaction;

    const groupHandle = 'my-hive';
    const groupOwnerHandle = 'alice';

    before(async () => {
      tx = await hiveFactory
        .connect(groupOwner)
        .createHive(platformId, groupHandle, groupOwnerHandle, honeyFee, {
          value: mintFee * 2,
        });
      const receipt = await tx.wait();

      hiveAddress = receipt.events?.find((e) => e.event === 'HiveCreated')?.args?.hiveAddress;
      hive = await ethers.getContractAt('Hive', hiveAddress);
    });

    it('Mints a TalentLayer ID to the owner', async () => {
      await expect(tx).to.changeTokenBalance(talentLayerID, groupOwner, 1);

      const groupOwnerId = await talentLayerID.ids(groupOwner.address);
      const profile = await talentLayerID.connect(groupOwner).profiles(groupOwnerId);

      expect(profile.platformId).to.equal(platformId);
      expect(profile.handle).to.equal(groupOwnerHandle);
    });

    it('Sets the owner of the group', async () => {
      const owner = await hive.owner();
      expect(owner).to.equal(groupOwner.address);
    });

    it('Adds the owner of the members group', async () => {
      const isMember = await hive.members(groupOwnerTlId);
      expect(isMember).to.be.equal(true);
    });

    it('Mints a TalentLayer ID to the group', async () => {
      await expect(tx).to.changeTokenBalance(talentLayerID, hive, 1);

      const groupId = await talentLayerID.ids(hiveAddress);
      const profile = await talentLayerID.connect(groupOwner).profiles(groupId);

      expect(profile.platformId).to.equal(platformId);
      expect(profile.handle).to.equal(groupHandle);
    });
  });

  describe('Join Group', async () => {
    let tx: ContractTransaction;

    const handle = 'bob__';

    before(async () => {
      const signature = await getSignature(groupOwner, hiveAddress);

      // Bob joins the group
      tx = await hive.connect(bob).join(signature, platformId, handle, {
        value: mintFee,
      });
    });

    it('Mints a TalentLayer ID to the user', async () => {
      await expect(tx).to.changeTokenBalance(talentLayerID, bob, 1);

      // const bobId = await talentLayerID.ids(bob.address);
      const profile = await talentLayerID.connect(groupOwner).profiles(bobTlId);

      expect(profile.platformId).to.equal(platformId);
      expect(profile.handle).to.equal(handle);
    });

    it('Adds the user to the members of the group', async () => {
      const isMember = await hive.members(bobTlId);
      expect(isMember).to.be.equal(true);
    });
  });

  describe('Create proposal request', async () => {
    const proposalParams: [number, string, number, number, string, number] = [
      serviceId,
      proposalToken,
      proposalAmount,
      platformId,
      proposalDataUri,
      proposalExpirationDate,
    ];

    const members = [groupOwnerTlId, bobTlId];
    const shares = [4500, 4500];

    it('Fails if user is not member of the group', async () => {
      const tx = hive.connect(dave).createProposalRequest(...proposalParams, members, shares);
      await expect(tx).to.be.revertedWith('Sender is not a member');
    });

    it('Fails if proposal members are not part of the group', async () => {
      const tx = hive.connect(dave).createProposalRequest(...proposalParams, [daveTlId], shares);
      await expect(tx).to.be.revertedWith('Sender is not a member');
    });

    it('Fails if the sum of the shares is not 100', async () => {
      const tx = hive.connect(bob).createProposalRequest(...proposalParams, members, [5000, 5000]);
      await expect(tx).to.be.revertedWith('Shares sum is not 100%');
    });

    describe('Successfull creation of proposal request', async () => {
      before(async () => {
        // Bob creates a proposal request
        await hive.connect(bob).createProposalRequest(...proposalParams, members, shares);
      });

      it('Updates the proposal request data', async () => {
        const proposalRequest = await hive.proposalRequests(proposalRequestId);
        expect(proposalRequest.ownerId).to.equal(bobTlId);
        expect(proposalRequest.serviceId).to.equal(serviceId);
        expect(proposalRequest.rateToken).to.equal(proposalToken);
        expect(proposalRequest.rateAmount).to.equal(proposalAmount);
        expect(proposalRequest.dataUri).to.equal(proposalDataUri);
        expect(proposalRequest.expirationDate).to.equal(proposalExpirationDate);
        expect(proposalRequest.status).to.equal(ProposalRequestStatus.Pending);
      });
    });
  });

  describe('Execute proposal request', async () => {
    it('Fails if user is not member of the group', async () => {
      const tx = hive.connect(dave).executeProposalRequest(proposalRequestId);
      await expect(tx).to.be.revertedWith('Sender is not a member');
    });

    it('Fails if user is the owner of the proposal request', async () => {
      const tx = hive.connect(bob).executeProposalRequest(proposalRequestId);
      await expect(tx).to.be.revertedWith('Owner cannot execute its own proposal request');
    });

    describe('Successfull execution of proposal request', async () => {
      let tx: ContractTransaction;

      before(async () => {
        // Carol joins the group
        const signature = await getSignature(groupOwner, hiveAddress);
        const handle = 'carol';
        tx = await hive.connect(carol).join(signature, platformId, handle, {
          value: mintFee,
        });

        // Carol executes the proposal request
        tx = await hive.connect(carol).executeProposalRequest(proposalRequestId);
      });

      it('Creates a proposal for the service', async () => {
        await expect(tx).to.not.be.reverted;

        const proposal = await talentLayerService.proposals(serviceId, hiveTlId);
        expect(proposal.ownerId).to.equal(hiveTlId);
        expect(proposal.rateToken).to.equal(proposalToken);
        expect(proposal.rateAmount).to.equal(proposalAmount);
        expect(proposal.dataUri).to.equal(proposalDataUri);
        expect(proposal.expirationDate).to.equal(proposalExpirationDate);
      });

      it('Fails if proposal request has already been executed', async () => {
        const tx = hive.connect(carol).executeProposalRequest(proposalRequestId);
        await expect(tx).to.be.revertedWith('Proposal request is not pending');
      });
    });
  });
});
