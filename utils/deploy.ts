import { ethers, network, upgrades } from 'hardhat';
import type { HiveFactory } from '../typechain-types/contracts';
import { Network, NetworkConfig, getConfig } from '../networkConfig';
import { TalentLayerID } from '../typechain-types/contracts/tests/talentlayer';

export async function deploy(): Promise<[HiveFactory, TalentLayerID]> {
  // const network = hre.network.name;
  const chainId = network.config.chainId ? network.config.chainId : Network.LOCAL;

  const networkConfig: NetworkConfig = getConfig(chainId);

  // Deploy PlatformId
  const TalentLayerPlatformID = await ethers.getContractFactory('TalentLayerPlatformID');
  const talentLayerPlatformID = await upgrades.deployProxy(TalentLayerPlatformID);

  // Deploy TalentLayerID
  const TalentLayerID = await ethers.getContractFactory('TalentLayerID');
  const talentLayerIDArgs: [string] = [talentLayerPlatformID.address];
  const talentLayerID = await upgrades.deployProxy(TalentLayerID, talentLayerIDArgs);

  // Deploy TalentLayerService
  const TalentLayerService = await ethers.getContractFactory('TalentLayerService');
  const talentLayerServiceArgs: [string, string] = [
    talentLayerID.address,
    talentLayerPlatformID.address,
  ];
  const talentLayerService = await upgrades.deployProxy(TalentLayerService, talentLayerServiceArgs);

  // Deploy TalentLayerArbitrator
  const TalentLayerArbitrator = await ethers.getContractFactory('TalentLayerArbitrator');
  await TalentLayerArbitrator.deploy(talentLayerPlatformID.address);

  // Deploy TalentLayerEscrow and escrow role on TalentLayerService
  const TalentLayerEscrow = await ethers.getContractFactory('TalentLayerEscrow');
  const TalentLayerEscrowArgs: [string, string, string, string | undefined] = [
    talentLayerService.address,
    talentLayerID.address,
    talentLayerPlatformID.address,
    networkConfig.multisigAddressList.fee,
  ];
  const talentLayerEscrow = await upgrades.deployProxy(TalentLayerEscrow, TalentLayerEscrowArgs);
  const escrowRole = await talentLayerService.ESCROW_ROLE();
  await talentLayerService.grantRole(escrowRole, talentLayerEscrow.address);

  // Deploy TalentLayerReview
  const TalentLayerReview = await ethers.getContractFactory('TalentLayerReview');
  const talentLayerReviewArgs: [string, string] = [
    talentLayerID.address,
    talentLayerService.address,
  ];
  await upgrades.deployProxy(TalentLayerReview, talentLayerReviewArgs);

  // Deploy SimpleERC20 Token
  const SimpleERC20 = await ethers.getContractFactory('SimpleERC20');
  await SimpleERC20.deploy();

  // Deploy HiveFactory
  const HiveFactory = await ethers.getContractFactory('HiveFactory');
  const hiveFactory = await HiveFactory.deploy(talentLayerID.address);
  await hiveFactory.deployed();

  return [hiveFactory, talentLayerID as TalentLayerID];
}
