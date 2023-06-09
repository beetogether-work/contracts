import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import { getSignature } from '../../utils/signature';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , groupOwner, bob] = await ethers.getSigners();

  // Get contracts
  const hive = await ethers.getContractAt('Hive', getDeploymentAddress(network, 'Hive'));

  const signature = await getSignature(groupOwner, hive.address);

  // Update data
  const platformId = 1;
  const handle = 'bob__';
  await hive.connect(bob).join(signature, platformId, handle);

  console.log('Joined hive');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
