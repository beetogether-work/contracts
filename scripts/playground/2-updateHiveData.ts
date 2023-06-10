import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import uploadToIPFS from '../../utils/uploadToIpfs';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , , groupOwner] = await ethers.getSigners();

  // Get contracts
  const hive = await ethers.getContractAt('Hive', getDeploymentAddress(network, 'Hive'));

  // Upload course data to IPFS
  const groupData = {
    offeredServices: 'A lot',
    manifesto: "Bee together. We are the best. Let's make this honey",
  };
  const dataUri = await uploadToIPFS(groupData);
  if (!dataUri) throw new Error('Failed to upload to IPFS');

  // Update data
  const tx = await hive.connect(groupOwner).updateDataUri(dataUri);
  await tx.wait();

  console.log('Updated group data');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
