import { Wallet } from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
// import hre from 'hardhat';
import { task } from 'hardhat/config';

task('deploy-zk-sync', 'Deploy all contracts')
  .addFlag('verify', 'Verify contracts on etherscan')
  .setAction(async (args, hre) => {
    // const { ethers } = hre;

    console.log('Yo');

    // The wallet that will deploy the token and the paymaster
    // It is assumed that this wallet already has sufficient funds on zkSync
    const wallet = new Wallet(process.env.PRIVATE_KEY || '');
    const deployer = new Deployer(hre, wallet);

    // Deploying the paymaster
    // const paymasterArtifact = await deployer.loadArtifact('HivePaymaster');
    // const paymaster = await deployer.deploy(paymasterArtifact);
    // console.log(`Paymaster address: ${paymaster.address}`);

    // Deploying the token
    const paymasterArtifact = await deployer.loadArtifact('Storage');
    const paymaster = await deployer.deploy(paymasterArtifact);
    console.log(`Storage address: ${paymaster.address}`);

    // console.log('Funding paymaster with ETH');
    // // Supplying paymaster with ETH
    // await (
    //   await deployer.zkWallet.sendTransaction({
    //     to: paymaster.address,
    //     value: ethers.utils.parseEther('0.06'),
    //   })
    // ).wait();

    // const paymasterBalance = await provider.getBalance(paymaster.address);

    // console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
  });
