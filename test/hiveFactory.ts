import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { HiveFactory, TalentLayerID } from '../typechain-types';
import { deploy } from '../utils/deploy';
import { expect } from 'chai';
import { TalentLayerPlatformID } from '../typechain-types/contracts/tests/talentlayer';
import { MintStatus } from '../utils/constants';
import { ContractTransaction } from 'ethers';

describe('HiveFactory', () => {
  let deployer: SignerWithAddress,
    platformOwner: SignerWithAddress,
    alice: SignerWithAddress,
    talentLayerID: TalentLayerID,
    talentLayerPlatformID: TalentLayerPlatformID,
    hiveFactory: HiveFactory;

  const platformId = 1;

  before(async () => {
    [deployer, platformOwner, alice] = await ethers.getSigners();
    [hiveFactory, talentLayerID, talentLayerPlatformID] = await deploy();

    // Disable whitelist for reserved handles
    await talentLayerID.connect(deployer).updateMintStatus(MintStatus.PUBLIC);

    // Create PlatformId
    await talentLayerPlatformID.connect(deployer).whitelistUser(platformOwner.address);
    await talentLayerPlatformID.connect(platformOwner).mint('bee-together');
  });

  describe('Create Hive', async () => {
    let tx: ContractTransaction;

    const groupHandle = 'my-hive';
    const ownerHandle = 'alice';
    const dataUri = '';

    before(async () => {
      tx = await hiveFactory
        .connect(alice)
        .createHive(platformId, groupHandle, ownerHandle, dataUri);
    });

    it('Mints a TalentLayer ID to the owner', async () => {
      await expect(tx).to.changeTokenBalance(talentLayerID, alice, 1);

      const aliceId = await talentLayerID.ids(alice.address);
      const profile = await talentLayerID.connect(alice).profiles(aliceId);

      expect(profile.platformId).to.equal(platformId);
      expect(profile.handle).to.equal(ownerHandle);
    });

    it('Mints a TalentLayer ID to the group', async () => {
      await expect(tx).to.changeTokenBalance(talentLayerID, alice, 1);

      const receipt = await tx.wait();
      const hiveAddress = receipt.events?.find((e) => e.event === 'HiveCreated')?.args?.hiveAddress;

      const groupId = await talentLayerID.ids(hiveAddress);
      const profile = await talentLayerID.connect(alice).profiles(groupId);

      expect(profile.platformId).to.equal(platformId);
      expect(profile.handle).to.equal(groupHandle);
    });
  });
});
