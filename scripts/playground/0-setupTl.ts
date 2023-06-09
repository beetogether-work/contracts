import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import { MintStatus } from '../../utils/constants';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [deployer, platformOwner] = await ethers.getSigners();

  // Get contracts

  const talentLayerID = await ethers.getContractAt(
    'TalentLayerID',
    getDeploymentAddress(network, 'TalentLayerID'),
  );

  console.log('talentLayerID', talentLayerID.address);

  const talentLayerPlatformID = await ethers.getContractAt(
    'TalentLayerPlatformID',
    getDeploymentAddress(network, 'TalentLayerPlatformID'),
  );

  console.log('TalentLayerPlatformID', talentLayerPlatformID.address);

  // Disable whitelist for reserved handles
  await talentLayerID.connect(deployer).updateMintStatus(MintStatus.PUBLIC);
  // await talentLayerID.connect(deployer).updateMintFee(100);

  // Create PlatformId
  await talentLayerPlatformID.connect(deployer).whitelistUser(platformOwner.address);
  await talentLayerPlatformID.connect(platformOwner).mint('bee-together');

  console.log('Minted platform id');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
