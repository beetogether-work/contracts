import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , groupOwner] = await ethers.getSigners();

  // Get contracts
  const hiveFactory = await ethers.getContractAt(
    'HiveFactory',
    getDeploymentAddress(network, 'HiveFactory'),
  );

  // Create course
  const platformId = 1;
  const groupHandle = 'my-hive';
  const ownerHandle = 'alice';
  const tx = await hiveFactory
    .connect(groupOwner)
    .createHive(platformId, groupHandle, ownerHandle, {
      // value: 100,
    });
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});