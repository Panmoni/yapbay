/**
 * Unified Blockchain Service
 * Main interface for all blockchain operations across different networks
 */

import {
  NetworkConfig,
  NetworkType,
  TransactionResult,
  EscrowState,
  EscrowEvent,
  CreateEscrowParams,
  FundEscrowParams,
  MarkFiatPaidParams,
  ReleaseEscrowParams,
  CancelEscrowParams,
  OpenDisputeParams,
  RespondToDisputeParams,
  ResolveDisputeParams,
} from '../blockchain/types/index.js';
import { networkRegistry } from '../blockchain/networks/index.js';
import { SolanaProgram } from '../blockchain/networks/solana/program.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

export interface BlockchainService {
  // Network management (simplified for Solana devnet only)
  getCurrentNetwork(): NetworkConfig;

  // Wallet integration (works with Dynamic.xyz)
  getWalletAddress(): string | null;
  getWalletBalance(): Promise<number>;

  // Escrow operations
  createEscrow(params: CreateEscrowParams): Promise<TransactionResult>;
  fundEscrow(params: FundEscrowParams): Promise<TransactionResult>;
  markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult>;
  releaseEscrow(params: ReleaseEscrowParams): Promise<TransactionResult>;
  cancelEscrow(params: CancelEscrowParams): Promise<TransactionResult>;

  // Dispute operations
  openDispute(params: OpenDisputeParams): Promise<TransactionResult>;
  respondToDispute(params: RespondToDisputeParams): Promise<TransactionResult>;
  resolveDispute(params: ResolveDisputeParams): Promise<TransactionResult>;

  // State queries
  getEscrowState(escrowId: number, tradeId: number): Promise<EscrowState>;
  getEscrowBalance(escrowId: number, tradeId: number): Promise<number>;

  // Event monitoring
  subscribeToEscrowEvents(
    escrowId: number,
    tradeId: number,
    callback: (event: EscrowEvent) => void
  ): () => void;
}

export class UnifiedBlockchainService implements BlockchainService {
  private currentNetwork: NetworkConfig;
  private eventSubscriptions: Map<string, () => void> = new Map();
  private walletAddress: string | null = null;
  private solanaProgram: SolanaProgram | null = null;

  constructor() {
    this.currentNetwork = networkRegistry.getDefault();
    this.initializeSolanaProgram();
  }

  private initializeSolanaProgram(): void {
    if (this.currentNetwork.type === NetworkType.SOLANA && this.currentNetwork.programId) {
      const connection = new Connection(this.currentNetwork.rpcUrl, 'confirmed');
      const programId = new PublicKey(this.currentNetwork.programId);
      this.solanaProgram = new SolanaProgram(connection, programId);
    }
  }

  // Network Management (simplified for Solana devnet only)
  getCurrentNetwork(): NetworkConfig {
    return this.currentNetwork;
  }

  // Wallet Integration (works with Dynamic.xyz)
  setWalletAddress(address: string | null): void {
    this.walletAddress = address;
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  // Update wallet in Solana program when Dynamic.xyz wallet changes
  updateWallet(wallet: Wallet): void {
    if (this.solanaProgram) {
      this.solanaProgram.updateWallet(wallet);
    }
  }

  async getWalletBalance(): Promise<number> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    // This would query the blockchain for the wallet's USDC balance
    // Implementation depends on the current network type
    throw new Error('Wallet balance query not implemented yet');
  }

  // Escrow Operations (Solana devnet only for now)
  async createEscrow(params: CreateEscrowParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.createEscrow(params);
  }

  async fundEscrow(params: FundEscrowParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.fundEscrow(params);
  }

  async markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.markFiatPaid(params);
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.releaseEscrow(params);
  }

  async cancelEscrow(params: CancelEscrowParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.cancelEscrow(params);
  }

  // Dispute Operations (Solana devnet only for now)
  async openDispute(params: OpenDisputeParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.openDisputeWithBond(params);
  }

  async respondToDispute(params: RespondToDisputeParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.respondToDisputeWithBond(params);
  }

  async resolveDispute(params: ResolveDisputeParams): Promise<TransactionResult> {
    if (!this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.resolveDisputeWithExplanation(params);
  }

  // State Queries (Solana devnet only for now)
  async getEscrowState(escrowId: number, tradeId: number): Promise<EscrowState> {
    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.getEscrowState(escrowId, tradeId);
  }

  async getEscrowBalance(escrowId: number, tradeId: number): Promise<number> {
    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    return this.solanaProgram.getEscrowBalance(escrowId, tradeId);
  }

  // Event Monitoring (Solana devnet only for now)
  subscribeToEscrowEvents(
    escrowId: number,
    tradeId: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _callback: (event: EscrowEvent) => void
  ): () => void {
    const subscriptionKey = `${escrowId}-${tradeId}`;

    // Unsubscribe from existing subscription if any
    if (this.eventSubscriptions.has(subscriptionKey)) {
      this.eventSubscriptions.get(subscriptionKey)?.();
    }

    if (!this.solanaProgram) {
      throw new Error('Solana program not initialized');
    }

    // For now, return a no-op unsubscribe function
    // Event subscription will be implemented when we add the actual Solana program methods
    const unsubscribe = () => {
      this.eventSubscriptions.delete(subscriptionKey);
    };

    this.eventSubscriptions.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  // Note: All Solana operations now handled by SolanaProgram class
}

// Singleton instance
export const blockchainService = new UnifiedBlockchainService();
