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

    const talentLayerService = await ethers.getContractAt(
      'TalentLayerService',
      getDeploymentAddress(network.name, 'TalentLayerService'),
    );

    const talentLayerEscrow = await ethers.getContractAt(
      'TalentLayerEscrow',
      getDeploymentAddress(network.name, 'TalentLayerEscrow'),
    );

    // Deploy HiveFactory
    const HiveFactory = await ethers.getContractFactory('HiveFactory');
    const hiveFactoryArgs: [string, string, string] = [
      talentLayerID.address,
      talentLayerService.address,
      talentLayerEscrow.address,
    ];
    const hiveFactory = await HiveFactory.deploy(...hiveFactoryArgs);
    await hiveFactory.deployed();

    if (verify) {
      await verifyAddress(hiveFactory.address, hiveFactoryArgs);
    }

    console.log('Deployed HiveFactory at', hiveFactory.address);
    setDeploymentAddress(network.name, 'HiveFactory', hiveFactory.address);
  });
