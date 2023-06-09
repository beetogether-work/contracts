import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

export const getSignature = async (
  signer: SignerWithAddress,
  groupAddress: string,
): Promise<string> => {
  const messageHash = ethers.utils.solidityKeccak256(['string', 'address'], ['join', groupAddress]);

  // Carol the owner of the platform signed the message with her private key
  const signature = await signer.signMessage(ethers.utils.arrayify(messageHash));

  return signature;
};
