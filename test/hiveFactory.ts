import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { HiveFactory, TalentLayerID } from '../typechain-types';
import { deploy } from '../utils/deploy';
import { expect } from 'chai';

describe('HiveFactory', () => {
  let deployer: SignerWithAddress,
    alice: SignerWithAddress,
    talentLayerID: TalentLayerID,
    hiveFactory: HiveFactory;

  before(async () => {
    [deployer, alice] = await ethers.getSigners();
    [hiveFactory, talentLayerID] = await deploy();
  });

  describe('Create Hive', async () => {
    it('Creates a new hive contract', async () => {
      const dataUri = '';
      const tx = await hiveFactory.connect(alice).createHive(dataUri);
      expect(tx).to.not.be.reverted;
    });
  });
});
