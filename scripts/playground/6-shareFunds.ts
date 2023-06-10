import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import { FEE_DIVIDER, META_EVIDENCE_CID } from '../../utils/constants';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [, , , bob, , dave] = await ethers.getSigners();

  // Get contracts
  const talentLayerService = await ethers.getContractAt(
    'TalentLayerService',
    getDeploymentAddress(network, 'TalentLayerService'),
  );

  const talentLayerEscrow = await ethers.getContractAt(
    'TalentLayerEscrow',
    getDeploymentAddress(network, 'TalentLayerEscrow'),
  );

  const talentLayerPlatformID = await ethers.getContractAt(
    'TalentLayerPlatformID',
    getDeploymentAddress(network, 'TalentLayerPlatformID'),
  );

  const daveTlId = 1;
  const hiveTlId = 3;
  const serviceId = 1;
  const transactionId = 1;

  const proposalRequestId = 1;
  const releasedAmount = ethers.utils.parseEther('0.0006');

  // Calculate total transaction amount
  const platformData = await talentLayerPlatformID.platforms(daveTlId);
  const proposal = await talentLayerService.proposals(serviceId, hiveTlId);
  const protocolEscrowFeeRate = ethers.BigNumber.from(
    await talentLayerEscrow.protocolEscrowFeeRate(),
  );
  const originServiceFeeRate = ethers.BigNumber.from(platformData.originServiceFeeRate);
  const originValidatedProposalFeeRate = ethers.BigNumber.from(
    platformData.originValidatedProposalFeeRate,
  );
  const { rateAmount } = proposal;
  const totalAmount = rateAmount.add(
    rateAmount
      .mul(protocolEscrowFeeRate.add(originServiceFeeRate).add(originValidatedProposalFeeRate))
      .div(ethers.BigNumber.from(FEE_DIVIDER)),
  );

  // Dave accepts the proposal
  await talentLayerEscrow
    .connect(dave)
    .createTransaction(serviceId, hiveTlId, META_EVIDENCE_CID, proposal.dataUri, {
      value: totalAmount,
    });

  // Dave releases funds of the transaction
  const tx = await talentLayerEscrow.connect(dave).release(daveTlId, transactionId, releasedAmount);
  await tx.wait();

  const hive = await ethers.getContractAt('Hive', getDeploymentAddress(network, 'Hive'));

  // Execute proposal request
  await hive.connect(bob).shareFunds(proposalRequestId);

  console.log('Shared funds');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
