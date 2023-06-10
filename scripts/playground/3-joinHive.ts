import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import { getSignature } from '../../utils/signature';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , , groupOwner, bob, carol] = await ethers.getSigners();

  // Get contracts
  const hive = await ethers.getContractAt('Hive', getDeploymentAddress(network, 'Hive'));

  const signature = await getSignature(groupOwner, hive.address);

  // Join hive
  const platformId = 1;
  await hive.connect(bob).join(signature, platformId, 'bob__');
  await hive.connect(carol).join(signature, platformId, 'carol');

  console.log('Joined hive');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
