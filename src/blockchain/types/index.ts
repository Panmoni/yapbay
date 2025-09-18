/**
 * Common blockchain types and interfaces
 */

export enum NetworkType {
  SOLANA = 'solana',
  EVM = 'evm',
}

export interface NetworkConfig {
  id: string;
  type: NetworkType;
  name: string;
  chainId?: number; // For EVM networks
  rpcUrl: string;
  programId?: string; // For Solana networks
  contractAddress?: string; // For EVM networks
  usdcMint?: string; // For Solana networks
  usdcAddress?: string; // For EVM networks
  arbitratorAddress: string;
  blockExplorerUrl: string;
  isTestnet: boolean;
  enabled: boolean;
}

export interface WalletConnection {
  address: string;
  network: NetworkConfig;
  connected: boolean;
}

export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  signature?: string; // For Solana
  error?: string;
  blockNumber?: number; // For EVM
  slot?: number; // For Solana
}

export interface EscrowState {
  id: number;
  tradeId: number;
  state: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED';
  amount: string;
  sellerAddress: string;
  buyerAddress: string;
  arbitratorAddress: string;
  depositDeadline?: number;
  fiatDeadline?: number;
  fiatPaid?: boolean;
  sequential?: boolean;
  sequentialEscrowAddress?: string;
  networkType: NetworkType;
}

export interface EscrowEvent {
  type: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED';
  escrowId: number;
  tradeId: number;
  transactionHash?: string;
  signature?: string;
  timestamp: number;
}

// Parameter interfaces for escrow operations
export interface CreateEscrowParams {
  escrowId: number;
  tradeId: number;
  sellerAddress: string;
  buyerAddress: string;
  arbitratorAddress: string;
  amount: string;
  depositDeadline: number;
  fiatDeadline: number;
  sequential?: boolean;
  sequentialEscrowAddress?: string;
}

export interface FundEscrowParams {
  escrowId: number;
  tradeId: number;
  amount: string;
  sellerAddress: string;
  sellerTokenAccount: string;
}

export interface MarkFiatPaidParams {
  escrowId: number;
  tradeId: number;
  buyerAddress: string;
}

export interface ReleaseEscrowParams {
  escrowId: number;
  tradeId: number;
  authorityAddress: string;
  buyerTokenAccount: string;
  arbitratorTokenAccount: string;
  sequentialEscrowTokenAccount?: string;
}

export interface CancelEscrowParams {
  escrowId: number;
  tradeId: number;
  sellerAddress: string;
  authorityAddress: string;
  sellerTokenAccount: string;
}

export interface OpenDisputeParams {
  escrowId: number;
  tradeId: number;
  evidenceHash: string;
  bondAmount: string;
  disputingPartyAddress: string;
  disputingPartyTokenAccount: string;
}

export interface RespondToDisputeParams {
  escrowId: number;
  tradeId: number;
  evidenceHash: string;
  bondAmount: string;
  respondingPartyAddress: string;
  respondingPartyTokenAccount: string;
}

export interface ResolveDisputeParams {
  escrowId: number;
  tradeId: number;
  resolutionExplanation: string;
  buyerWins: boolean;
  arbitratorAddress: string;
  sellerAddress: string;
  buyerTokenAccount: string;
  sellerTokenAccount: string;
  arbitratorTokenAccount: string;
  resolutionHash: string;
}

export interface DefaultJudgmentParams {
  escrowId: number;
  tradeId: number;
  sellerAddress: string;
  arbitratorAddress: string;
  buyerTokenAccount: string;
  sellerTokenAccount: string;
}

export interface InitializeBondParams {
  escrowId: number;
  tradeId: number;
  bondAmount: string;
  payerAddress: string;
  tokenMint: string;
}

export interface UpdateSequentialParams {
  escrowId: number;
  tradeId: number;
  newSequentialAddress: string;
  buyerAddress: string;
}

export interface AutoCancelParams {
  escrowId: number;
  tradeId: number;
  arbitratorAddress: string;
  sellerAddress: string;
  sellerTokenAccount: string;
}
