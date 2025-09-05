/**
 * React hook for blockchain service integration with Dynamic.xyz
 */

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { blockchainService, BlockchainService } from '../services/blockchainService.js';
import { NetworkConfig } from '../blockchain/types/index.js';
import { Wallet } from '@coral-xyz/anchor';

// Helper function to convert Dynamic.xyz wallet to Anchor-compatible wallet
function createAnchorWallet(dynamicWallet: unknown): Wallet {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallet = dynamicWallet as any; // Dynamic.xyz wallet type
  return {
    publicKey: wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
  } as Wallet;
}

export interface UseBlockchainServiceReturn {
  // Service instance
  service: BlockchainService;

  // Current state
  currentNetwork: NetworkConfig;
  walletAddress: string | null;
  isConnected: boolean;

  // Network info
  networkName: string;
  isTestnet: boolean;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

export function useBlockchainService(): UseBlockchainServiceReturn {
  const { primaryWallet } = useDynamicContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading] = useState<boolean>(false);

  // Get current network and wallet info
  const currentNetwork = blockchainService.getCurrentNetwork();
  const walletAddress = blockchainService.getWalletAddress();
  const isConnected = !!primaryWallet && !!walletAddress;

  // Update wallet address when Dynamic.xyz wallet changes
  useEffect(() => {
    if (primaryWallet?.address) {
      blockchainService.setWalletAddress(primaryWallet.address);
      // Update wallet in Solana program - convert Dynamic.xyz wallet to Anchor format
      const anchorWallet = createAnchorWallet(primaryWallet);
      blockchainService.updateWallet(anchorWallet);
    } else {
      blockchainService.setWalletAddress(null);
    }
  }, [primaryWallet?.address, primaryWallet]);

  // Clear error when wallet connects
  useEffect(() => {
    if (isConnected) {
      setError(null);
    }
  }, [isConnected]);

  return {
    service: blockchainService,
    currentNetwork,
    walletAddress,
    isConnected,
    networkName: currentNetwork.name,
    isTestnet: currentNetwork.isTestnet,
    isLoading,
    error,
  };
}

// Convenience hook for just the service instance
export function useBlockchain(): BlockchainService {
  const { service } = useBlockchainService();
  return service;
}

// Hook for network information only
export function useNetworkInfo() {
  const { currentNetwork, networkName, isTestnet } = useBlockchainService();
  return {
    network: currentNetwork,
    name: networkName,
    isTestnet,
  };
}
