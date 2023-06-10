import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import { ETH_ADDRESS } from '../../utils/constants';
import uploadToIPFS from '../../utils/uploadToIpfs';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , , , bob] = await ethers.getSigners();

  // Get contracts
  const hive = await ethers.getContractAt('Hive', getDeploymentAddress(network, 'Hive'));

  // Update data
  // const groupOwnerTlId = 120;
  // const bobTlId = 122;
  // const serviceId = 100;
  const groupOwnerTlId = 2;
  const bobTlId = 4;
  const serviceId = 1;
  const tokenAddress = ETH_ADDRESS;
  const proposalAmount = ethers.utils.parseEther('0.001');
  const now = Math.floor(Date.now() / 1000);
  const proposalExpirationDate = now + 60 * 60 * 24 * 15;
  const platformId = 1;
  const proposalMembers = [groupOwnerTlId, bobTlId];
  const proposalShares = [4000, 5000];

  // Upload proposal request data to IPFS
  const proposalData = {
    about: 'We are super good at this',
    rateType: 3,
    expectedHours: 10,
    // startDate: now,
    // video_url: '',
  };

  const dataUri = await uploadToIPFS(proposalData);
  if (!dataUri) throw new Error('Failed to upload to IPFS');

  // Create proposal request
  await hive
    .connect(bob)
    .createProposalRequest(
      serviceId,
      tokenAddress,
      proposalAmount,
      platformId,
      dataUri,
      proposalExpirationDate,
      proposalMembers,
      proposalShares,
    );

  console.log('Created proposal request');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
