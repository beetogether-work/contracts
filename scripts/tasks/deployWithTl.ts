import { setDeploymentAddress } from '../../.deployment/deploymentManager';
import { verifyAddress } from '../../utils/verifyAddress';
import { task } from 'hardhat/config';
import { ETH_ADDRESS, MintStatus } from '../../utils/constants';
import { Network, NetworkConfig, getConfig } from '../../networkConfig';

task('deploy-with-tl', 'Deploy all TalentLayer contracts and BeeTogether contracts')
  .addFlag('useTestErc20', 'deploy a mock ERC20 contract')
  .addFlag('verify', 'Verify contracts on etherscan')
  .setAction(async (args, { ethers, network }) => {
    const { verify, useTestErc20 } = args;
    console.log('Network:', network.name);

    const chainId = network.config.chainId ? network.config.chainId : Network.LOCAL;
    const networkConfig: NetworkConfig = getConfig(chainId);

    const [deployer, platformOwner, , bob, carol, dave] = await ethers.getSigners();
    console.log('Using address: ', deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log('Balance: ', ethers.utils.formatEther(balance));

    // Deploy TalentLayerPlatformID contract
    const TalentLayerPlatformID = await ethers.getContractFactory('TalentLayerPlatformID');
    // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
    const talentLayerPlatformID = await (upgrades as HardhatUpgrades).deployProxy(
      TalentLayerPlatformID,
      {
        timeout: 0,
        pollingInterval: 20000,
      },
    );

    if (verify) {
      await verifyAddress(talentLayerPlatformID.address);
    }

    const talentLayerPlatformIDImplementationAddress =
      await // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
      (upgrades as HardhatUpgrades).erc1967.getImplementationAddress(talentLayerPlatformID.address);
    console.log('TalentLayerPlatformID addresses:', {
      proxy: talentLayerPlatformID.address,
      implementation: talentLayerPlatformIDImplementationAddress,
    });

    setDeploymentAddress(network.name, 'TalentLayerPlatformID', talentLayerPlatformID.address);

    // Deploy ID contract
    const TalentLayerID = await ethers.getContractFactory('TalentLayerID');
    const talentLayerIDArgs: [string] = [talentLayerPlatformID.address];
    // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
    const talentLayerID = await (upgrades as HardhatUpgrades).deployProxy(
      TalentLayerID,
      talentLayerIDArgs,
      {
        timeout: 0,
        pollingInterval: 20000,
      },
    );
    if (verify) {
      await verifyAddress(talentLayerID.address);
    }
    const talentLayerIDImplementationAddress =
      await // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
      (upgrades as HardhatUpgrades).erc1967.getImplementationAddress(talentLayerID.address);
    console.log('talentLayerID addresses:', {
      proxy: talentLayerID.address,
      implementation: talentLayerIDImplementationAddress,
    });

    setDeploymentAddress(network.name, 'TalentLayerID', talentLayerID.address);

    // Deploy TalentLayerService Contract
    const TalentLayerService = await ethers.getContractFactory('TalentLayerService');
    const talentLayerServiceArgs: [string, string] = [
      talentLayerID.address,
      talentLayerPlatformID.address,
    ];
    // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
    const talentLayerService = await (upgrades as HardhatUpgrades).deployProxy(
      TalentLayerService,
      talentLayerServiceArgs,
      {
        timeout: 0,
        pollingInterval: 20000,
      },
    );

    if (verify) {
      await verifyAddress(talentLayerService.address);
    }
    const talentLayerServiceImplementationAddress =
      await // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
      (upgrades as HardhatUpgrades).erc1967.getImplementationAddress(talentLayerService.address);
    console.log('TalentLayerService addresses:', {
      proxy: talentLayerService.address,
      implementation: talentLayerServiceImplementationAddress,
    });
    setDeploymentAddress(network.name, 'TalentLayerService', talentLayerService.address);

    // Deploy Review contract
    const TalentLayerReview = await ethers.getContractFactory('TalentLayerReview');
    const talentLayerReviewArgs: [string, string] = [
      talentLayerID.address,
      talentLayerService.address,
    ];
    // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
    const talentLayerReview = await (upgrades as HardhatUpgrades).deployProxy(
      TalentLayerReview,
      talentLayerReviewArgs,
      {
        timeout: 0,
        pollingInterval: 20000,
      },
    );
    if (verify) {
      await verifyAddress(talentLayerReview.address);
    }
    const talentLayerReviewImplementationAddress =
      await // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
      (upgrades as HardhatUpgrades).erc1967.getImplementationAddress(talentLayerReview.address);
    console.log('TalentLayerReview addresses:', {
      proxy: talentLayerReview.address,
      implementation: talentLayerReviewImplementationAddress,
    });

    setDeploymentAddress(network.name, 'TalentLayerReview', talentLayerReview.address);

    // Deploy TalentLayerArbitrator
    const TalentLayerArbitrator = await ethers.getContractFactory('TalentLayerArbitrator');
    const talentLayerArbitrator = await TalentLayerArbitrator.deploy(talentLayerPlatformID.address);
    if (verify) {
      await verifyAddress(talentLayerArbitrator.address, [talentLayerPlatformID.address]);
    }
    console.log('TalentLayerArbitrator contract address:', talentLayerArbitrator.address);

    setDeploymentAddress(network.name, 'TalentLayerArbitrator', talentLayerArbitrator.address);

    // Add TalentLayerArbitrator to platform available arbitrators
    await talentLayerPlatformID.addArbitrator(talentLayerArbitrator.address, true);

    const TalentLayerEscrow = await ethers.getContractFactory('TalentLayerEscrow');
    const talentLayerEscrowArgs: [string, string, string, string | undefined] = [
      talentLayerService.address,
      talentLayerID.address,
      talentLayerPlatformID.address,
      networkConfig.multisigAddressList.fee,
    ];
    // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
    const talentLayerEscrow = await (upgrades as HardhatUpgrades).deployProxy(
      TalentLayerEscrow,
      talentLayerEscrowArgs,
      {
        timeout: 0,
        pollingInterval: 20000,
      },
    );
    if (verify) {
      await verifyAddress(talentLayerEscrow.address);
    }
    const talentLayerEscrowImplementationAddress =
      await // @ts-ignore: upgrades is imported in hardhat.config.ts - HardhatUpgrades
      (upgrades as HardhatUpgrades).erc1967.getImplementationAddress(talentLayerEscrow.address);
    console.log('TalentLayerEscrow contract addresses:', {
      proxy: talentLayerEscrow.address,
      implementation: talentLayerEscrowImplementationAddress,
    });

    setDeploymentAddress(network.name, 'TalentLayerEscrow', talentLayerEscrow.address);

    if (useTestErc20) {
      // Deploy ERC20 contract

      // amount transferred to bob, dave and carol
      const amount = ethers.utils.parseUnits('10', 18);
      const SimpleERC20 = await ethers.getContractFactory('SimpleERC20');
      const simpleERC20 = await SimpleERC20.deploy();
      await simpleERC20.transfer(bob.address, amount);
      await simpleERC20.transfer(carol.address, amount);
      await simpleERC20.transfer(dave.address, amount);

      console.log('simpleERC20 address:', simpleERC20.address);

      // get the SimpleERC20 balance in wallet of bob, carol and dave
      const balance = await simpleERC20.balanceOf(bob.address);
      console.log('SimpleERC20 balance:', balance.toString());
      const balance2 = await simpleERC20.balanceOf(carol.address);
      console.log('SimpleERC20 balance2:', balance2.toString());
      const balance3 = await simpleERC20.balanceOf(dave.address);
      console.log('SimpleERC20 balance3:', balance3.toString());

      setDeploymentAddress(network.name, 'SimpleERC20', simpleERC20.address);
    }

    // Grant escrow role
    const escrowRole = await talentLayerService.ESCROW_ROLE();
    await talentLayerService.grantRole(escrowRole, talentLayerEscrow.address);

    // =========================== Setup TalentLayer ==============================

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
    await talentLayerID.connect(dave).mint(0, 'dave_');

    // Create PlatformId
    await talentLayerPlatformID.connect(deployer).whitelistUser(platformOwner.address);
    await talentLayerPlatformID.connect(platformOwner).mint('bee-together');

    // Dave creates a service
    const serviceDataUri = 'QmNSARUuUMHkFcnSzrCAhmZkmQu7ViK18sPkg48xnbAmv3';
    const daveId = 1;
    const platformId = 1;
    await talentLayerService.connect(dave).createService(daveId, platformId, serviceDataUri, []);

    // =========================== Deploy BeeTogether ==============================

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
