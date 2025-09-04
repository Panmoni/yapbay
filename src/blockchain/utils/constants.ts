/**
 * Blockchain constants and configuration
 */

export const BLOCKCHAIN_CONSTANTS = {
  // Solana constants
  SOLANA: {
    MAX_AMOUNT: 100, // Maximum USDC amount
    MIN_AMOUNT: 0.01, // Minimum USDC amount
    DEFAULT_DEPOSIT_DEADLINE_HOURS: 24,
    DEFAULT_FIAT_DEADLINE_HOURS: 72,
    DEFAULT_DISPUTE_DEADLINE_HOURS: 168, // 7 days
    BOND_AMOUNT: 5, // 5 USDC bond for disputes
    FEE_PERCENTAGE: 0.5, // 0.5% fee
  },

  // EVM constants (for future use)
  EVM: {
    MAX_AMOUNT: 100,
    MIN_AMOUNT: 0.01,
    DEFAULT_DEPOSIT_DEADLINE_HOURS: 24,
    DEFAULT_FIAT_DEADLINE_HOURS: 72,
    DEFAULT_DISPUTE_DEADLINE_HOURS: 168,
    BOND_AMOUNT: 5,
    FEE_PERCENTAGE: 0.5,
  },

  // Transaction constants
  TRANSACTION: {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    CONFIRMATION_TIMEOUT_MS: 300000, // 5 minutes
    POLLING_INTERVAL_MS: 15000, // 15 seconds
  },

  // Network constants
  NETWORK: {
    DEFAULT_RPC_TIMEOUT_MS: 30000, // 30 seconds
    MAX_RPC_RETRIES: 3,
  },
} as const;

export type BlockchainConstants = typeof BLOCKCHAIN_CONSTANTS;
