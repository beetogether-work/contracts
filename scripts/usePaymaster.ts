import hre, { ethers } from 'hardhat';
import { Provider, utils, Wallet } from 'zksync-web3';

// Put the address of the deployed paymaster here
const PAYMASTER_ADDRESS = '0x4467e99ED7357A34C15f78174eb5172A9A524Ef1';

// Wallet private key
const EMPTY_WALLET_PRIVATE_KEY = '3cf1c261b0b9ab7df51e11637255b191538d17486504d58d5c191530d2e83fa3';

const STORAGE_ADDRESS = '0x11598c9Af4416fbf43C9C233aB11F1Bdc32c84DC';

async function main() {
  console.log('Here');
  const provider = new Provider('https://testnet.era.zksync.dev');
  const emptyWallet = new Wallet(EMPTY_WALLET_PRIVATE_KEY, provider);

  // const paymasterWallet = new Wallet(PAYMASTER_ADDRESS, provider);
  // Obviously this step is not required, but it is here purely to demonstrate that indeed the wallet has no ether.
  const ethBalance = await emptyWallet.getBalance();
  if (!ethBalance.eq(0)) {
    throw new Error('The wallet is not empty!');
  }

  let paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
  console.log(`Paymaster ETH balance is ${paymasterBalance.toString()}`);

  const gasPrice = await provider.getGasPrice();

  // Encoding the "ApprovalBased" paymaster flow's input
  const paymasterParams = utils.getPaymasterParams(PAYMASTER_ADDRESS, {
    type: 'General',
    // token: TOKEN_ADDRESS,
    // set minimalAllowance as we defined in the paymaster contract
    // minimalAllowance: ethers.BigNumber.from(1),
    // empty bytes as testnet paymaster does not use innerInput
    innerInput: new Uint8Array(),
  });

  // const storage = await ethers.getContractAt('Storage', STORAGE_ADDRESS);
  const storageArtifact = hre.artifacts.readArtifactSync('Storage');
  const storage = new ethers.Contract(STORAGE_ADDRESS, storageArtifact.abi, emptyWallet);

  // Estimate gas fee for mint transaction
  const message = 'ciao';
  const gasLimit = await storage.estimateGas.setMessage(message, {
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      paymasterParams: paymasterParams,
    },
  });

  const fee = gasPrice.mul(gasLimit.toString());
  console.log('Transaction fee estimation is :>> ', fee.toString());

  // Call function with paymaster
  const tx = await storage.setMessage(message, {
    // paymaster info
    customData: {
      paymasterParams: paymasterParams,
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    },
  });
  await tx.wait();

  paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
  console.log(`Paymaster ETH balance is now ${paymasterBalance.toString()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
