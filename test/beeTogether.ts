import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { Hive, HiveFactory, TalentLayerID } from '../typechain-types';
import { deploy } from '../utils/deploy';
import { expect } from 'chai';
import { TalentLayerPlatformID } from '../typechain-types/contracts/tests/talentlayer';
import { ETH_ADDRESS, MintStatus } from '../utils/constants';
import { ContractTransaction } from 'ethers';
import { getSignature } from '../utils/signature';
import exp from 'constants';

describe('HiveFactory', () => {
  let deployer: SignerWithAddress,
    platformOwner: SignerWithAddress,
    groupOwner: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress,
    talentLayerID: TalentLayerID,
    talentLayerPlatformID: TalentLayerPlatformID,
    hiveAddress: string,
    hiveFactory: HiveFactory,
    hive: Hive;

  const platformId = 1;
  const mintFee = 100;

  const groupOwnerTlId = 1;
  const hiveTlId = 2;
  const bobTlId = 3;
  const carolTlId = 4;
  const groupOwnerHandle = 'alice';

  before(async () => {
    [deployer, platformOwner, groupOwner, bob] = await ethers.getSigners();
    [hiveFactory, talentLayerID, talentLayerPlatformID] = await deploy();

    // Disable whitelist for reserved handles
    await talentLayerID.connect(deployer).updateMintStatus(MintStatus.PUBLIC);
    await talentLayerID.connect(deployer).updateMintFee(mintFee);

    // Create PlatformId
    await talentLayerPlatformID.connect(deployer).whitelistUser(platformOwner.address);
    await talentLayerPlatformID.connect(platformOwner).mint('bee-together');
  });

  describe('Create Hive', async () => {
    let tx: ContractTransaction;

    const groupHandle = 'my-hive';
    const ownerHandle = 'alice';

    before(async () => {
      tx = await hiveFactory.connect(groupOwner).createHive(platformId, groupHandle, ownerHandle, {
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
      expect(profile.handle).to.equal(ownerHandle);
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
    // it('Fails if ', async () => {});

    describe('Successfull creation of proposal request', async () => {
      const proposalRequestId = 1;
      const serviceId = 1;
      const proposalToken = ETH_ADDRESS;
      const proposalAmount = 1000;
      const proposalDataUri = 'QmNSARUuUMHkFcnSzrCAhmZkmQu7ViK18sPkg48xnbAmv4';
      const now = Math.floor(Date.now() / 1000);
      const proposalExpirationDate = now + 60 * 60 * 24 * 15;

      before(async () => {
        // Bob creates a proposal request
        await hive
          .connect(bob)
          .createProposalRequest(
            serviceId,
            proposalToken,
            proposalAmount,
            platformId,
            proposalDataUri,
            proposalExpirationDate,
            [bobTlId],
            [100],
          );
      });

      it('Updates the proposal request data', async () => {
        const proposalRequest = await hive.proposalRequests(proposalRequestId);
        expect(proposalRequest.serviceId).to.equal(serviceId);
        expect(proposalRequest.rateToken).to.equal(proposalToken);
        expect(proposalRequest.rateAmount).to.equal(proposalAmount);
        expect(proposalRequest.dataUri).to.equal(proposalDataUri);
        expect(proposalRequest.expirationDate).to.equal(proposalExpirationDate);
      });
    });
  });
});