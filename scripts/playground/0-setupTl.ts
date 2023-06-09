import hre, { ethers } from 'hardhat';
import { getDeploymentAddress } from '../../.deployment/deploymentManager';
import { ETH_ADDRESS, MintStatus } from '../../utils/constants';

async function main() {
  const network = hre.network.name;
  console.log('Network:', network);

  const [deployer, platformOwner, alice] = await ethers.getSigners();

  // Get contracts

  const talentLayerID = await ethers.getContractAt(
    'TalentLayerID',
    getDeploymentAddress(network, 'TalentLayerID'),
  );

  const talentLayerService = await ethers.getContractAt(
    'TalentLayerService',
    getDeploymentAddress(network, 'TalentLayerService'),
  );

  console.log('talentLayerID', talentLayerID.address);

  const talentLayerPlatformID = await ethers.getContractAt(
    'TalentLayerPlatformID',
    getDeploymentAddress(network, 'TalentLayerPlatformID'),
  );

  console.log('TalentLayerPlatformID', talentLayerPlatformID.address);

  // Disable whitelist for reserved handles
  await talentLayerID.connect(deployer).updateMintStatus(MintStatus.PUBLIC);

  // Whitelist a list of authorized tokens

  const allowedTokenList = [ETH_ADDRESS];
  const minTokenWhitelistTransactionAmount = 10;
  for (const tokenAddress of allowedTokenList) {
    await talentLayerService
      .connect(deployer)
      .updateAllowedTokenList(tokenAddress, true, minTokenWhitelistTransactionAmount);
  }

  // Set service contract address on ID contract
  await talentLayerID.connect(deployer).setIsServiceContract(talentLayerService.address, true);

  // Dave mints a TalentLayer ID
  await talentLayerID.connect(alice).mint(0, 'alice');

  // Create PlatformId
  await talentLayerPlatformID.connect(deployer).whitelistUser(platformOwner.address);
  await talentLayerPlatformID.connect(platformOwner).mint('bee-together');

  // Dave creates a service
  const serviceDataUri = 'QmNSARUuUMHkFcnSzrCAhmZkmQu7ViK18sPkg48xnbAmv3';
  const aliceId = 1;
  const platformId = 1;
  await talentLayerService.connect(alice).createService(aliceId, platformId, serviceDataUri, []);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
