/**
 * Network Registry System
 * Manages all supported blockchain networks and their configurations
 */

import { NetworkConfig, NetworkType } from '../types/index.js';

export class NetworkRegistry {
  private networks: Map<string, NetworkConfig> = new Map();

  /**
   * Register a new network configuration
   */
  register(network: NetworkConfig): void {
    this.networks.set(network.id, network);
  }

  /**
   * Get a network configuration by ID
   */
  get(id: string): NetworkConfig | undefined {
    return this.networks.get(id);
  }

  /**
   * Get all enabled networks
   */
  getEnabled(): NetworkConfig[] {
    return Array.from(this.networks.values()).filter(n => n.enabled);
  }

  /**
   * Get all networks of a specific type
   */
  getByType(type: NetworkType): NetworkConfig[] {
    return Array.from(this.networks.values()).filter(n => n.type === type);
  }

  /**
   * Get enabled networks of a specific type
   */
  getEnabledByType(type: NetworkType): NetworkConfig[] {
    return Array.from(this.networks.values()).filter(n => n.type === type && n.enabled);
  }

  /**
   * Get the default network (from environment or first enabled)
   */
  getDefault(): NetworkConfig {
    // Check if we're in a Vite environment
    const isViteEnv = typeof import.meta !== 'undefined' && import.meta.env;

    if (isViteEnv) {
      const defaultId = import.meta.env.VITE_DEFAULT_NETWORK;
      if (defaultId && this.networks.has(defaultId)) {
        const network = this.networks.get(defaultId)!;
        if (network.enabled) {
          return network;
        }
      }
    }

    // Fallback to first enabled network
    const enabled = this.getEnabled();
    if (enabled.length > 0) {
      return enabled[0];
    }

    throw new Error('No enabled networks found');
  }

  /**
   * Get all network IDs
   */
  getAllIds(): string[] {
    return Array.from(this.networks.keys());
  }

  /**
   * Check if a network is registered
   */
  has(id: string): boolean {
    return this.networks.has(id);
  }

  /**
   * Get network count
   */
  size(): number {
    return this.networks.size;
  }

  /**
   * Clear all networks (useful for testing)
   */
  clear(): void {
    this.networks.clear();
  }
}

// Singleton instance
export const networkRegistry = new NetworkRegistry();

/**
 * Initialize networks from environment variables
 */
export function initializeNetworks(): void {
  // Clear existing networks
  networkRegistry.clear();

  // Check if we're in a Vite environment
  const isViteEnv = typeof import.meta !== 'undefined' && import.meta.env;

  if (!isViteEnv) {
    console.warn('Network registry: Not in Vite environment, using fallback network configuration');
    // Add fallback networks for testing
    networkRegistry.register({
      id: 'solana-devnet',
      type: NetworkType.SOLANA,
      name: 'Solana Devnet (Fallback)',
      rpcUrl: 'https://api.devnet.solana.com',
      programId: '4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x',
      usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      arbitratorAddress: 'GGrXhNVxUZXaA2uMopsa5q23aPmoNvQF14uxqo8qENUr',
      blockExplorerUrl: 'https://explorer.solana.com/?cluster=devnet',
      isTestnet: true,
      enabled: true,
    });
    return;
  }

  // Initialize Solana networks
  if (import.meta.env.VITE_SOLANA_RPC_URL_DEVNET) {
    networkRegistry.register({
      id: 'solana-devnet',
      type: NetworkType.SOLANA,
      name: 'Solana Devnet',
      rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL_DEVNET,
      programId: import.meta.env.VITE_SOLANA_PROGRAM_ID_DEVNET,
      usdcMint: import.meta.env.VITE_SOLANA_USDC_MINT_DEVNET,
      arbitratorAddress: import.meta.env.VITE_SOLANA_ARBITRATOR_ADDRESS,
      blockExplorerUrl: 'https://explorer.solana.com/?cluster=devnet',
      isTestnet: true,
      enabled: true,
    });
  }

  if (import.meta.env.VITE_SOLANA_RPC_URL_MAINNET) {
    networkRegistry.register({
      id: 'solana-mainnet',
      type: NetworkType.SOLANA,
      name: 'Solana Mainnet',
      rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL_MAINNET,
      programId: import.meta.env.VITE_SOLANA_PROGRAM_ID_MAINNET,
      usdcMint: import.meta.env.VITE_SOLANA_USDC_MINT_MAINNET,
      arbitratorAddress: import.meta.env.VITE_SOLANA_ARBITRATOR_ADDRESS,
      blockExplorerUrl: 'https://explorer.solana.com',
      isTestnet: false,
      enabled: true,
    });
  }

  // Initialize EVM networks (disabled by default)
  if (import.meta.env.VITE_CELO_ENABLED === 'true') {
    if (import.meta.env.VITE_CELO_RPC_URL_TESTNET) {
      networkRegistry.register({
        id: 'celo-alfajores',
        type: NetworkType.EVM,
        name: 'Celo Alfajores',
        chainId: 44787,
        rpcUrl: import.meta.env.VITE_CELO_RPC_URL_TESTNET,
        contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_TESTNET,
        usdcAddress: import.meta.env.VITE_USDC_ADDRESS_TESTNET,
        arbitratorAddress: import.meta.env.VITE_ARBITRATOR_ADDRESS,
        blockExplorerUrl: 'https://alfajores.celoscan.io',
        isTestnet: true,
        enabled: false, // Disabled by default
      });
    }

    if (import.meta.env.VITE_CELO_RPC_URL) {
      networkRegistry.register({
        id: 'celo-mainnet',
        type: NetworkType.EVM,
        name: 'Celo Mainnet',
        chainId: 42220,
        rpcUrl: import.meta.env.VITE_CELO_RPC_URL,
        contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
        usdcAddress: import.meta.env.VITE_USDC_ADDRESS,
        arbitratorAddress: import.meta.env.VITE_ARBITRATOR_ADDRESS,
        blockExplorerUrl: 'https://celoscan.io',
        isTestnet: false,
        enabled: false, // Disabled by default
      });
    }
  }
}

// Auto-initialize networks when module is imported
initializeNetworks();
