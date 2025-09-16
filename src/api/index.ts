import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import type {
  Account,
  Offer,
  Trade,
  Escrow,
  PricesResponse,
  TransactionRecord,
  HealthResponse,
} from '../types';

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

// Function to set the network context for multi-network support
export const setNetworkId = (networkId: number | null) => {
  if (networkId) {
    api.defaults.headers.common['X-Network-ID'] = networkId.toString();
  } else {
    delete api.defaults.headers.common['X-Network-ID'];
  }
};

// --- Re-export types for backward compatibility ---
export type {
  Account,
  Offer,
  Trade,
  Escrow,
  PriceData,
  PricesResponse,
  Dispute,
  TransactionRecord,
  NetworkStatus,
  ApiVersion,
  HealthResponse,
} from '../types';

// --- API Functions ---

// Accounts API
export const createAccount = (
  data: Partial<Pick<Account, 'wallet_address' | 'username' | 'email'>>
) => api.post<Account>('/accounts', data); // Return full Account object

export const getAccountById = (
  id: number // Use number ID to match actual API
) => api.get<Account>(`/accounts/${id}`);

export const getAccount = () =>
  // Renamed from getMyAccount
  api.get<Account>('/accounts/me');

export const updateAccount = (
  id: number,
  data: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at' | 'wallet_address'>>
) => api.put<Account>(`/accounts/${id}`, data); // Return full Account object

// Offers API
export const createOffer = (
  data: Partial<Omit<Offer, 'id' | 'creator_account_id' | 'created_at' | 'updated_at'>>
) => api.post<Offer>('/offers', data); // Return full Offer object

export const getOffers = (params?: { type?: string; token?: string; owner?: string }) =>
  api.get<Offer[]>('/offers', { params });

export const getOfferById = (
  id: number // Use number ID to match actual API
) => api.get<Offer>(`/offers/${id}`);

export const updateOffer = (
  id: number,
  data: Partial<Omit<Offer, 'id' | 'creator_account_id' | 'created_at' | 'updated_at'>>
) => api.put<Offer>(`/offers/${id}`, data); // Return full Offer object

export const deleteOffer = (
  id: number // Use number ID to match actual API
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
  id: number // Use number ID to match actual API
) => api.get<Trade>(`/trades/${id}`);

// Define TradeUpdateData if different from Partial<Trade>
type TradeUpdateData = Partial<Pick<Trade, 'overall_status'>>;
export const updateTrade = (id: number, data: TradeUpdateData) =>
  api.put<Trade>(`/trades/${id}`, data); // Return full Trade object

export const markFiatPaid = (id: number) =>
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
 * @param data.transaction_hash Transaction hash of the blockchain transaction (EVM)
 * @param data.signature Transaction signature (Solana)
 * @param data.escrow_id Escrow ID (must be a number)
 * @param data.seller Seller's wallet address
 * @param data.buyer Buyer's wallet address
 * @param data.amount Crypto amount (supports decimal values, e.g. 22.22)
 * @param data.sequential Optional: Whether this is a sequential escrow
 * @param data.sequential_escrow_address Optional: Address of the sequential escrow
 * @param data.program_id Optional: Solana program ID
 * @param data.escrow_pda Optional: Solana PDA address
 * @param data.escrow_token_account Optional: Solana token account
 * @param data.trade_onchain_id Optional: Solana trade ID
 * @returns Promise with escrow recording response
 */
export const recordEscrow = (data: {
  trade_id: number;
  transaction_hash?: string; // EVM
  signature?: string; // Solana
  escrow_id: number;
  seller: string;
  buyer: string;
  amount: number;
  sequential?: boolean;
  sequential_escrow_address?: string;
  // Solana-specific fields
  program_id?: string;
  escrow_pda?: string;
  escrow_token_account?: string;
  trade_onchain_id?: string;
}) =>
  api.post<{
    success: boolean;
    escrowId: number; // Blockchain escrow ID
    escrowDbId: number; // Database primary key for the escrow record
    txHash: string;
    networkFamily: string;
    blockExplorerUrl: string;
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
export const markTradeFiatPaid = (tradeId: number) => {
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
