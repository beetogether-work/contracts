import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , , , , carol] = await ethers.getSigners();

  // Get contracts
  const hive = await ethers.getContractAt('Hive', getDeploymentAddress(network, 'Hive'));

  // Execute proposal request
  const proposalRequestId = 1;
  await hive.connect(carol).executeProposalRequest(proposalRequestId);

  console.log('Created proposal request');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
