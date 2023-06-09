import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { Hive, HiveFactory, TalentLayerID } from '../typechain-types';
import { deploy } from '../utils/deploy';
import { expect } from 'chai';
import { TalentLayerPlatformID } from '../typechain-types/contracts/tests/talentlayer';
import { MintStatus } from '../utils/constants';
import { ContractTransaction } from 'ethers';
import { getSignature } from '../utils/signature';

describe('HiveFactory', () => {
  let deployer: SignerWithAddress,
    platformOwner: SignerWithAddress,
    groupOwner: SignerWithAddress,
    bob: SignerWithAddress,
    talentLayerID: TalentLayerID,
    talentLayerPlatformID: TalentLayerPlatformID,
    hiveAddress: string,
    hiveFactory: HiveFactory,
    hive: Hive;

  const platformId = 1;
  const mintFee = 100;

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

    it('Mints a TalentLayer ID to the group', async () => {
      await expect(tx).to.changeTokenBalance(talentLayerID, groupOwner, 1);

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

      const bobId = await talentLayerID.ids(bob.address);
      const profile = await talentLayerID.connect(groupOwner).profiles(bobId);

      expect(profile.platformId).to.equal(platformId);
      expect(profile.handle).to.equal(handle);
    });
  });
});
