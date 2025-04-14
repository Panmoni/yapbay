// src/utils/blockchain.ts
import { ethers } from 'ethers';
import { config } from '../config';
import YapBayEscrowABI from './YapBayEscrow.json';

export const getProvider = () => {
  return new ethers.providers.JsonRpcProvider(config.celoRpcUrl);
};

export const getContract = (signerOrProvider = getProvider()) => {
  return new ethers.Contract(
    config.contractAddress,
    YapBayEscrowABI.abi,
    signerOrProvider
  );
};

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      return { provider, signer };
    } catch (error) {
      console.error('User rejected connection', error);
      throw error;
    }
  } else {
    throw new Error('Ethereum wallet not detected');
  }
};
