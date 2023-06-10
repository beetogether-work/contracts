import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-contract-sizer';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-verify';

import './scripts/tasks/deploy';
import './scripts/tasks/deployWithTl';
import './scripts/tasks/deployZkSync';

import dotenv from 'dotenv';

dotenv.config();

const mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error('Please set your MNEMONIC in a .env file');
}

const accounts = {
  mnemonic,
  count: 100,
};

const config: HardhatUserConfig = {
  zksolc: {
    version: '1.3.11', // Use latest available in https://github.com/matter-labs/zksolc-bin/
    compilerSource: 'binary',
    settings: {},
  },
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      zksync: true,
    },
    mumbai: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      accounts,
    },
    zkSyncTestnet: {
      url: 'https://testnet.era.zksync.dev',
      ethNetwork: 'goerli', // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: true,
      verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification',
      accounts,
    },
    'mantle-testnet': {
      url: 'https://rpc.testnet.mantle.xyz/',
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    // only: [''],
  },
};

export default config;
