// src/config/index.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  dynamicSdkId: import.meta.env.VITE_DYNAMIC_ENV_ID,
  celoRpcUrl: import.meta.env.VITE_CELO_RPC_URL,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  usdcAddressAlfajores: import.meta.env.VITE_USDC_ADDRESS_ALFAJORES, // Add USDC address
  arbitratorAddress: import.meta.env.VITE_ARBITRATOR_ADDRESS, // Add arbitrator address
  blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://celo-alfajores.blockscout.com',
};