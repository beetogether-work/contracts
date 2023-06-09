import { ethers } from 'ethers';

export enum Network {
  LOCAL = 31337,
}

export type NetworkConfig = {
  multisigAddressList: { admin?: `0x${string}`; fee: `0x${string}` };
  allowedTokenList: {
    [key: string]: {
      address: `0x${string}`;
      minTransactionAmount: string;
      decimals: number;
    };
  };
  platformList: { [name: string]: `0x${string}` };
};

const local: NetworkConfig = {
  multisigAddressList: {
    fee: '0x3Fba71369E5E2E947AE2320274b1677de7D28120',
  },
  allowedTokenList: {
    ETH: {
      address: ethers.constants.AddressZero,
      minTransactionAmount: '0.001',
      decimals: 18,
    },
  },
  platformList: {
    hirevibes: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    workpod: '0x4444F618BA8E99435E721abF3c611D5105A407e9',
    indie: '0x8d960334c2EF30f425b395C1506Ef7c5783789F3',
  },
};

export const configs: { [networkId in Network]: NetworkConfig } = {
  [Network.LOCAL]: local,
};

export const getConfig = (networkId: Network): NetworkConfig => {
  return configs[networkId];
};
