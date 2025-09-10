import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';

// Use the API URL from the config file
const API_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Optional: Add interceptors for logging or error handling if needed
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // console.log("API Request:", config.method?.toUpperCase(), config.url);
    // Automatically add token from localStorage if available
    const token = localStorage.getItem('jwt_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // console.log("API Response:", response.status, response.data);
    return response;
  },
  (error: unknown) => {
    const axiosError = error as { response?: { status?: number }; config?: { url?: string } };
    const status = axiosError.response?.status;
    const url = axiosError.config?.url;

    // Suppress 404 errors for /accounts/me endpoint (user hasn't created account yet)
    if (status === 404 && url?.includes('/accounts/me')) {
      console.warn('Account not found - user needs to create their account first');
    } else {
      // Log all other errors normally
      console.error('API Error:', status, (error as Error).message, url);
    }

    // Handle specific errors like 401 Unauthorized if needed
    return Promise.reject(error);
  }
);

// Function to manually set the auth token (if needed elsewhere, though interceptor handles it)
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwt_token', token); // Also store in localStorage
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('jwt_token');
  }
};

// --- Define Types (Mirroring Solana example and src/types/index.ts) ---
// Note: Using types from src/types/index.ts is generally preferred to avoid duplication.
// If these types diverge from src/types/index.ts, consider consolidating them.
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
  transaction_hash: string;
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
  block_number?: number;
  gas_used?: string;
  error_message?: string;
  created_at: string;
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

// --- API Functions ---

// Accounts API
export const createAccount = (
  data: Partial<Pick<Account, 'wallet_address' | 'username' | 'email'>>
) => api.post<Account>('/accounts', data); // Return full Account object

export const getAccountById = (
  id: string // Use string ID if Celo API uses it
) => api.get<Account>(`/accounts/${id}`);

export const getAccount = () =>
  // Renamed from getMyAccount
  api.get<Account>('/accounts/me');

export const updateAccount = (
  id: string,
  data: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'wallet_address'>>
) => api.put<Account>(`/accounts/${id}`, data); // Return full Account object

// Offers API
export const createOffer = (
  data: Partial<Omit<Offer, 'id' | 'creator_account_id' | 'created_at' | 'updated_at'>>
) => api.post<Offer>('/offers', data); // Return full Offer object

export const getOffers = (params?: { type?: string; token?: string; owner?: string }) =>
  api.get<Offer[]>('/offers', { params });

export const getOfferById = (
  id: string // Use string ID if Celo API uses it
) => api.get<Offer>(`/offers/${id}`);

export const updateOffer = (
  id: string,
  data: Partial<Omit<Offer, 'id' | 'creator_account_id' | 'created_at' | 'updated_at'>>
) => api.put<Offer>(`/offers/${id}`, data); // Return full Offer object

export const deleteOffer = (
  id: string // Use string ID if Celo API uses it
) => api.delete<{ message: string }>(`/offers/${id}`);

// Trades API
// Define TradeCreateData if different from Partial<Trade>
type TradeCreateData = { leg1_offer_id: number } & Partial<
  Omit<Trade, 'id' | 'created_at' | 'updated_at'>
>;
export const createTrade = (data: TradeCreateData) => api.post<Trade>('/trades', data); // Return full Trade object

export const getTrades = (params?: { status?: string; user?: string }) =>
  api.get<Trade[]>('/trades', { params });

export const getMyTrades = () => api.get<Trade[]>('/my/trades');

export const getTradeById = (
  id: string // Use string ID if Celo API uses it
) => api.get<Trade>(`/trades/${id}`);

// Define TradeUpdateData if different from Partial<Trade>
type TradeUpdateData = Partial<Pick<Trade, 'overall_status'>>;
export const updateTrade = (id: string, data: TradeUpdateData) =>
  api.put<Trade>(`/trades/${id}`, data); // Return full Trade object

export const markFiatPaid = (id: number | string) =>
  api.put<{ id: number }>(`/trades/${id}`, { fiat_paid: true });

// Escrow API
export interface EscrowResponse {
  transaction: string; // Base64-encoded serialized transaction
  escrow_address: string; // Escrow PDA
}

/**
 * Records an escrow that was created on the blockchain
 * @param data Object containing escrow recording parameters
 * @param data.trade_id Trade ID (must be an integer)
 * @param data.transaction_hash Transaction hash of the blockchain transaction
 * @param data.escrow_id Escrow ID (must be a number as a string)
 * @param data.seller Seller's wallet address
 * @param data.buyer Buyer's wallet address
 * @param data.amount Crypto amount (supports decimal values, e.g. 22.22)
 * @param data.sequential Optional: Whether this is a sequential escrow
 * @param data.sequential_escrow_address Optional: Address of the sequential escrow
 * @returns Promise with escrow recording response
 */
export const recordEscrow = (data: {
  trade_id: number;
  transaction_hash: string;
  escrow_id: string;
  seller: string;
  buyer: string;
  amount: number;
  sequential?: boolean;
  sequential_escrow_address?: string;
}) =>
  api.post<{
    success: boolean;
    escrowId: string; // Blockchain escrow ID (uint256 as string)
    escrowDbId: number; // Database primary key for the escrow record
    txHash: string;
    blockNumber: number | bigint; // Block number can be large
  }>('/escrows/record', data);

/**
 * Funds an existing escrow
 * @param data Object containing escrow funding parameters
 * @param data.escrow_id Escrow ID (must be an integer)
 * @param data.trade_id Trade ID (must be an integer)
 * @param data.seller Seller's wallet address
 * @param data.seller_token_account Seller's token account
 * @param data.token_mint Token mint address
 * @param data.amount Crypto amount (supports decimal values, e.g. 22.22)
 * @returns Promise with escrow funding response
 */
export const fundEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  seller: string;
  seller_token_account: string;
  token_mint: string;
  amount: number;
}) => api.post<EscrowResponse>('/escrows/fund', data);

export const getEscrow = (tradeId: number) => api.get<Escrow>(`/escrows/${tradeId}`);

export const getMyEscrows = () => api.get<Escrow[]>('/my/escrows');

/**
 * Releases an escrow and transfers funds to the buyer
 * @param data Object containing escrow release parameters
 * @param data.escrow_id Escrow ID (must be an integer)
 * @param data.trade_id Trade ID (must be an integer)
 * @param data.authority Optional: Authority's wallet address
 * @param data.buyer_token_account Optional: Buyer's token account
 * @param data.arbitrator_token_account Optional: Arbitrator's token account
 * @param data.sequential_escrow_token_account Optional: Sequential escrow token account
 * @param data.tx_hash Optional: Transaction hash if released on-chain
 * @param data.block_number Optional: Block number if released on-chain
 * @returns Promise with escrow release response
 */
export const releaseEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  authority?: string;
  buyer_token_account?: string;
  arbitrator_token_account?: string;
  sequential_escrow_token_account?: string;
  tx_hash?: string;
  block_number?: number;
}) => api.post<EscrowResponse>('/escrows/release', data);

/**
 * Cancels an escrow and returns funds to the seller
 * @param data Object containing escrow cancellation parameters
 * @param data.escrow_id Escrow ID (must be an integer)
 * @param data.trade_id Trade ID (must be an integer)
 * @param data.seller Seller's wallet address
 * @param data.authority Authority's wallet address
 * @param data.seller_token_account Optional: Seller's token account
 * @param data.tx_hash Optional: Transaction hash if cancelled on-chain
 * @param data.block_number Optional: Block number if cancelled on-chain
 * @returns Promise with escrow cancellation response
 */
export const cancelEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  seller: string;
  authority: string;
  seller_token_account?: string;
  tx_hash?: string;
  block_number?: number;
}) => api.post<EscrowResponse>('/escrows/cancel', data);

/**
 * Initiates a dispute for an escrow
 * @param data Object containing escrow dispute parameters
 * @param data.escrow_id Escrow ID (must be an integer)
 * @param data.trade_id Trade ID (must be an integer)
 * @param data.disputing_party Disputing party's wallet address
 * @param data.disputing_party_token_account Disputing party's token account
 * @param data.evidence_hash Optional: Hash of evidence
 * @param data.tx_hash Optional: Transaction hash if disputed on-chain
 * @param data.block_number Optional: Block number if disputed on-chain
 * @returns Promise with escrow dispute response
 */
export const disputeEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  disputing_party: string;
  disputing_party_token_account: string;
  evidence_hash?: string;
  tx_hash?: string;
  block_number?: number;
}) => api.post<EscrowResponse>('/escrows/dispute', data);

// Add this function to handle marking trades as paid
export const markTradeFiatPaid = (tradeId: number | string) => {
  return api.post<{ message: string }>(`/escrows/mark-fiat-paid`, {
    trade_id: tradeId,
  });
};

/**
 * Records a blockchain transaction
 * @param data Transaction data to record
 * @returns Promise with transaction recording response
 */
export const recordTransaction = (data: {
  trade_id: number;
  escrow_id?: number;
  transaction_hash: string;
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
  block_number?: number;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  metadata?: Record<string, string>;
}) => {
  console.log('[recordTransaction] Sending data to API:', data);
  return api.post<{
    success: boolean;
    transactionId: number;
    txHash: string;
    blockNumber?: number;
  }>('/transactions/record', data);
};

/**
 * Get transactions for a specific trade
 * @param tradeId The ID of the trade
 * @param type Optional transaction type filter
 * @returns Promise with array of transaction records
 */
export const getTradeTransactions = (tradeId: number, type?: string) =>
  api.get<TransactionRecord[]>(`/transactions/trade/${tradeId}${type ? `?type=${type}` : ''}`);

/**
 * Get all transactions for the authenticated user
 * @param params Optional parameters for filtering and pagination
 * @returns Promise with array of transaction records
 */
export const getUserTransactions = (params?: {
  type?: string;
  limit?: number;
  offset?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.append('type', params.type);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return api.get<TransactionRecord[]>(`/transactions/user${queryString}`);
};

// Prices API
export const getPrices = () => api.get<PricesResponse>('/prices');

// Health API
export const getHealth = () => api.get<HealthResponse>('/health');

// Export the api instance for use elsewhere
export default api;
