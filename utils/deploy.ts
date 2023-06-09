import { ethers } from 'hardhat';
import { HiveFactory } from '../typechain-types';

export async function deploy(): Promise<[HiveFactory]> {
  // Deploy HiveFactory
  const HiveFactory = await ethers.getContractFactory('HiveFactory');
  const hiveFactory = await HiveFactory.deploy();
  await hiveFactory.deployed();

  return [hiveFactory];
}
