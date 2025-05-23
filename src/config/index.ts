// src/config/index.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  dynamicSdkId: import.meta.env.VITE_DYNAMIC_ENV_ID,
  arbitratorAddress: import.meta.env.VITE_ARBITRATOR_ADDRESS,
  
  // Network configurations
  networks: {
    testnet: {
      chainId: 44787,
      rpcUrl: import.meta.env.VITE_CELO_RPC_URL_TESTNET,
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_TESTNET,
      usdcAddress: import.meta.env.VITE_USDC_ADDRESS_TESTNET,
      blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL_TESTNET,
    },
    mainnet: {
      chainId: 42220,
      rpcUrl: import.meta.env.VITE_CELO_RPC_URL,
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
      usdcAddress: import.meta.env.VITE_USDC_ADDRESS,
      blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL,
    }
  },
  
  // Legacy properties for backward compatibility
  celoRpcUrl: import.meta.env.VITE_CELO_RPC_URL,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  usdcAddressAlfajores: import.meta.env.VITE_USDC_ADDRESS_TESTNET,
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://celo-alfajores.blockscout.com',
};

// Helper function to get network config based on chain ID
export const getNetworkConfig = (chainId: number) => {
  if (chainId === 42220) {
    return config.networks.mainnet;
  } else if (chainId === 44787) {
    return config.networks.testnet;
  } else {
    // Default to testnet for unknown networks
    return config.networks.testnet;
  }
};