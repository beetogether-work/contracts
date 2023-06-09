import { getDeploymentAddress, setDeploymentAddress } from '../../.deployment/deploymentManager';
import { verifyAddress } from '../../utils/verifyAddress';
import { task } from 'hardhat/config';

task('deploy', 'Deploy all contracts')
  .addFlag('verify', 'Verify contracts on etherscan')
  .setAction(async (args, { ethers, network }) => {
    const { verify } = args;
    console.log('Network:', network.name);

    const [deployer] = await ethers.getSigners();
    console.log('Using address: ', deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Balance: ', ethers.utils.formatEther(balance));

    const talentLayerID = await ethers.getContractAt(
      'TalentLayerID',
      getDeploymentAddress(network.name, 'TalentLayerID'),
    );

    // Deploy HiveFactory
    const HiveFactory = await ethers.getContractFactory('HiveFactory');
    const hiveFactory = await HiveFactory.deploy(talentLayerID.address);
    await hiveFactory.deployed();

    if (verify) {
      await verifyAddress(hiveFactory.address);
    }

    console.log('Deployed HiveFactory at', hiveFactory.address);
    setDeploymentAddress(network.name, 'HiveFactory', hiveFactory.address);
  });
