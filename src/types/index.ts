// src/types/index.ts
export interface Account {
  id: number;
  wallet_address: string;
  username: string;
  email: string;
  telegram_username?: string;
  telegram_id?: number;
  profile_photo_url?: string;
  phone_country_code?: string;
  phone_number?: string;
  available_from?: string;
  available_to?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  creator_account_id: number;
  network_id?: number; // Added for multi-network support
  offer_type: 'BUY' | 'SELL';
  token: string;
  min_amount: number;
  max_amount: number;
  total_available_amount: number;
  rate_adjustment: number;
  terms: string;
  escrow_deposit_time_limit: { minutes: number } | string; // Support both object and string formats
  fiat_payment_time_limit: { minutes: number } | string; // Support both object and string formats
  fiat_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: number;
  leg1_offer_id: number;
  leg2_offer_id?: number | null;
  overall_status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  from_fiat_currency: string;
  destination_fiat_currency: string;
  from_bank?: string | null;
  destination_bank?: string | null;
  network_id?: number; // Added for multi-network support
  created_at: string;
  updated_at: string;

  leg1_state?:
    | 'CREATED'
    | 'FUNDED'
    | 'FIAT_PAID'
    | 'RELEASED'
    | 'CANCELLED'
    | 'DISPUTED'
    | 'RESOLVED'
    | 'AWAITING_FIAT_PAYMENT'
    | 'PENDING_CRYPTO_RELEASE'
    | 'COMPLETED'; // Added missing states from schema + reordered slightly
  leg1_seller_account_id?: number;
  leg1_buyer_account_id?: number | null;
  leg1_crypto_token?: string;
  leg1_crypto_amount?: string;
  leg1_fiat_amount?: string | null;
  leg1_fiat_currency?: string;
  leg1_escrow_address?: string | null;
  leg1_created_at?: string;
  leg1_escrow_deposit_deadline?: string | null;
  leg1_fiat_payment_deadline?: string | null;
  leg1_fiat_paid_at?: string | null;
  leg1_released_at?: string | null;
  leg1_cancelled_at?: string | null;
  leg1_cancelled_by?: string | null;
  leg1_dispute_id?: number | null;
  leg1_escrow_onchain_id?: string | null; // Added new field

  leg2_state?: string | null;
  leg2_seller_account_id?: number | null;
  leg2_buyer_account_id?: number | null;
  leg2_crypto_token?: string | null;
  leg2_crypto_amount?: string | null;
  leg2_fiat_amount?: string | null;
  leg2_fiat_currency?: string | null;
  leg2_escrow_address?: string | null;
  leg2_created_at?: string | null;
  leg2_escrow_deposit_deadline?: string | null;
  leg2_fiat_payment_deadline?: string | null;
  leg2_fiat_paid_at?: string | null;
  leg2_released_at?: string | null;
  leg2_cancelled_at?: string | null;
  leg2_cancelled_by?: string | null;
  leg2_dispute_id?: number | null;
  leg2_escrow_onchain_id?: string | null; // Added new field
}

export interface Escrow {
  id: number;
  trade_id: number;
  escrow_address: string;
  seller_address: string;
  buyer_address: string;
  arbitrator_address: string;
  token_type: string;
  amount: string;
  state: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED';
  sequential: boolean;
  sequential_escrow_address: string | null;
  onchain_escrow_id: string | null;
  // Solana-specific fields
  network_family?: 'evm' | 'solana';
  program_id?: string;
  escrow_pda?: string;
  escrow_token_account?: string;
  escrow_onchain_id?: string;
  trade_onchain_id?: string;
  network_id?: number;
  network?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceData {
  price: string;
  timestamp: number;
}

export interface PricesResponse {
  status: string;
  data: {
    USDC: {
      USD: PriceData;
      COP: PriceData;
      EUR: PriceData;
      NGN: PriceData;
      VES: PriceData;
    };
  };
}

export interface Dispute {
  id: number;
  trade_id: number;
  escrow_address: string;
  initiator_address: string;
  initiator_evidence_hash: string | null;
  responder_address: string | null;
  responder_evidence_hash: string | null;
  resolution_hash: string | null;
  bond_amount: string;
  status: 'OPENED' | 'RESPONDED' | 'RESOLVED' | 'DEFAULTED';
  initiated_at: string;
  responded_at: string | null;
  resolved_at: string | null;
  winner_address: string | null;
}

export interface TransactionRecord {
  id: number;
  trade_id: number;
  escrow_id?: number;
  transaction_hash?: string; // EVM only
  signature?: string; // Solana only
  transaction_type:
    | 'CREATE_ESCROW'
    | 'FUND_ESCROW'
    | 'MARK_FIAT_PAID'
    | 'RELEASE_ESCROW'
    | 'CANCEL_ESCROW'
    | 'DISPUTE_ESCROW'
    | 'OPEN_DISPUTE'
    | 'RESPOND_DISPUTE'
    | 'RESOLVE_DISPUTE'
    | 'OTHER';
  from_address: string;
  to_address?: string;
  amount?: string;
  token_type?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  block_number?: number; // EVM only
  slot?: number; // Solana only
  gas_used?: string;
  error_message?: string;
  created_at: string;
  network?: string;
  network_family?: 'evm' | 'solana';
  metadata?: Record<string, string>;
}

export interface NetworkStatus {
  id: number;
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
  contractAddress: string;
  isTestnet: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status: string;
  error: string | null;
  providerChainId: number;
  providerName: string;
}

export interface ApiVersion {
  version: string;
  gitCommitHash: string;
  gitCommitDate: string;
  gitBranch: string;
  buildDate: string;
  isDirty: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  userWallet: string;
  dbStatus: string;
  apiVersion: ApiVersion;
  contractVersion: string;
  networks: NetworkStatus[];
  summary: {
    totalNetworks: number;
    activeNetworks: number;
    connectedNetworks: number;
    errorNetworks: number;
  };
}
