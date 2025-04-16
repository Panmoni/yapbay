// src/config/index.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  dynamicSdkId: import.meta.env.VITE_DYNAMIC_ENV_ID,
  celoRpcUrl: import.meta.env.VITE_CELO_RPC_URL,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
};