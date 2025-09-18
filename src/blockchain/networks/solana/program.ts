/**
 * Solana Program Interface
 * Integrates with the YapBay escrow program using Anchor
 */

import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import idl from '../../../contracts/solana/idl.json';
import type { LocalsolanaContracts } from '../../../contracts/solana/types.js';
import { PDADerivation } from '../../utils/pda.js';
import {
  CreateEscrowParams,
  FundEscrowParams,
  MarkFiatPaidParams,
  ReleaseEscrowParams,
  CancelEscrowParams,
  OpenDisputeParams,
  RespondToDisputeParams,
  ResolveDisputeParams,
  DefaultJudgmentParams,
  InitializeBondParams,
  UpdateSequentialParams,
  AutoCancelParams,
  EscrowState,
  TransactionResult,
  NetworkType,
} from '../../types/index.js';

export interface SolanaProgramInterface {
  // Core escrow operations
  createEscrow(params: CreateEscrowParams): Promise<TransactionResult>;
  fundEscrow(params: FundEscrowParams): Promise<TransactionResult>;
  markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult>;
  releaseEscrow(params: ReleaseEscrowParams): Promise<TransactionResult>;
  cancelEscrow(params: CancelEscrowParams): Promise<TransactionResult>;

  // Dispute operations
  openDisputeWithBond(params: OpenDisputeParams): Promise<TransactionResult>;
  respondToDisputeWithBond(params: RespondToDisputeParams): Promise<TransactionResult>;
  resolveDisputeWithExplanation(params: ResolveDisputeParams): Promise<TransactionResult>;
  defaultJudgment(params: AutoCancelParams): Promise<TransactionResult>;

  // Utility operations
  initializeBuyerBondAccount(params: InitializeBondParams): Promise<TransactionResult>;
  initializeSellerBondAccount(params: InitializeBondParams): Promise<TransactionResult>;
  updateSequentialAddress(params: UpdateSequentialParams): Promise<TransactionResult>;
  autoCancel(params: AutoCancelParams): Promise<TransactionResult>;

  // State queries
  getEscrowState(escrowId: number, tradeId: number): Promise<EscrowState>;
  getEscrowBalance(escrowId: number, tradeId: number): Promise<number>;

  // Wallet balance queries
  getUsdcBalance(): Promise<number>;
}

export class SolanaProgram implements SolanaProgramInterface {
  private connection: Connection;
  private programId: PublicKey;
  private usdcMint: PublicKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dynamicWallet: any; // Dynamic.xyz wallet

  constructor(
    connection: Connection,
    programId: PublicKey,
    usdcMint: PublicKey,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dynamicWallet?: any
  ) {
    this.connection = connection;
    this.programId = programId;
    this.usdcMint = usdcMint;
    this.dynamicWallet = dynamicWallet;
  }

  // Update wallet when Dynamic.xyz wallet changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateWallet(dynamicWallet: any): void {
    this.dynamicWallet = dynamicWallet;
    // Program will be recreated when needed with the new wallet
  }

  // Helper method to get the proper provider and program with Dynamic.xyz wallet
  private async getProviderAndProgram(): Promise<{
    provider: AnchorProvider;
    program: Program<LocalsolanaContracts>;
  }> {
    if (!this.dynamicWallet) {
      throw new Error('Dynamic.xyz wallet not connected');
    }

    // Use our configured connection (devnet) instead of wallet's default connection
    const connection = this.connection;
    const signer = await this.dynamicWallet.getSigner();

    // Create Anchor provider with Dynamic.xyz wallet
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: new PublicKey(this.dynamicWallet.address),
        signTransaction: async tx => signer.signTransaction(tx),
        signAllTransactions: async txs => signer.signAllTransactions(txs),
      },
      { commitment: 'confirmed' }
    );

    // Create program with the provider
    const program = new Program(
      idl as LocalsolanaContracts,
      provider
    ) as Program<LocalsolanaContracts>;

    return { provider, program };
  }

  // Core Escrow Operations
  async createEscrow(params: CreateEscrowParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const buyer = new PublicKey(params.buyerAddress);

      // Build transaction
      const tx = await program.methods
        .createEscrow(
          new BN(params.escrowId),
          new BN(params.tradeId),
          new BN(params.amount),
          params.sequential || false,
          params.sequentialEscrowAddress ? new PublicKey(params.sequentialEscrowAddress) : null
        )
        .accounts({
          seller: seller,
          buyer: buyer,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async fundEscrow(params: FundEscrowParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Get USDC mint from network config
      const usdcMint = new PublicKey(
        this.connection.rpcEndpoint.includes('devnet')
          ? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Devnet USDC
          : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Mainnet USDC
      );

      // Build transaction - pass escrowId and tradeId as arguments
      const tx = await program.methods
        .fundEscrow(new BN(params.escrowId), new BN(params.tradeId))
        .accounts({
          seller: seller,
          sellerTokenAccount: sellerTokenAccount,
          tokenMint: usdcMint,
          // tokenProgram: TOKEN_PROGRAM_ID,
          // systemProgram: SystemProgram.programId,
          // rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      console.error('❌ [ERROR] fundEscrow error:', error);

      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const buyer = new PublicKey(params.buyerAddress);

      // Build transaction
      const tx = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const authority = new PublicKey(params.authorityAddress);
      const buyerTokenAccount = new PublicKey(params.buyerTokenAccount);
      const arbitratorTokenAccount = new PublicKey(params.arbitratorTokenAccount);
      const sequentialEscrowTokenAccount = params.sequentialEscrowTokenAccount
        ? new PublicKey(params.sequentialEscrowTokenAccount)
        : null;

      // Build transaction
      const tx = await program.methods
        .releaseEscrow()
        .accounts({
          authority: authority,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: sequentialEscrowTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async cancelEscrow(params: CancelEscrowParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const authority = new PublicKey(params.authorityAddress);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Build transaction
      const tx = await program.methods
        .cancelEscrow()
        .accounts({
          seller: seller,
          authority: authority,
          sellerTokenAccount: sellerTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  // Dispute Operations
  async openDisputeWithBond(params: OpenDisputeParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const disputingParty = new PublicKey(params.disputingPartyAddress);
      const disputingPartyTokenAccount = new PublicKey(params.disputingPartyTokenAccount);

      // Convert evidence hash string to byte array
      const evidenceHashBytes = new Uint8Array(32);
      if (params.evidenceHash.length === 64) {
        // Hex string
        for (let i = 0; i < 32; i++) {
          evidenceHashBytes[i] = parseInt(params.evidenceHash.substr(i * 2, 2), 16);
        }
      } else {
        // Assume it's a base64 or other format, convert to bytes
        const hashBuffer = Buffer.from(params.evidenceHash, 'utf8');
        evidenceHashBytes.set(hashBuffer.slice(0, 32));
      }

      // Build transaction
      const tx = await program.methods
        .openDisputeWithBond(Array.from(evidenceHashBytes))
        .accounts({
          disputingParty: disputingParty,
          disputingPartyTokenAccount: disputingPartyTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async respondToDisputeWithBond(params: RespondToDisputeParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const respondingParty = new PublicKey(params.respondingPartyAddress);
      const respondingPartyTokenAccount = new PublicKey(params.respondingPartyTokenAccount);

      // Convert evidence hash string to byte array
      const evidenceHashBytes = new Uint8Array(32);
      if (params.evidenceHash.length === 64) {
        // Hex string
        for (let i = 0; i < 32; i++) {
          evidenceHashBytes[i] = parseInt(params.evidenceHash.substr(i * 2, 2), 16);
        }
      } else {
        // Assume it's a base64 or other format, convert to bytes
        const hashBuffer = Buffer.from(params.evidenceHash, 'utf8');
        evidenceHashBytes.set(hashBuffer.slice(0, 32));
      }

      // Build transaction
      const tx = await program.methods
        .respondToDisputeWithBond(Array.from(evidenceHashBytes))
        .accounts({
          respondingParty: respondingParty,
          respondingPartyTokenAccount: respondingPartyTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async resolveDisputeWithExplanation(params: ResolveDisputeParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const arbitrator = new PublicKey(params.arbitratorAddress);
      const seller = new PublicKey(params.sellerAddress);
      const buyerTokenAccount = new PublicKey(params.buyerTokenAccount);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);
      const arbitratorTokenAccount = new PublicKey(params.arbitratorTokenAccount);

      // Convert resolution hash string to byte array
      const resolutionHashBytes = new Uint8Array(32);
      if (params.resolutionHash.length === 64) {
        // Hex string
        for (let i = 0; i < 32; i++) {
          resolutionHashBytes[i] = parseInt(params.resolutionHash.substr(i * 2, 2), 16);
        }
      } else {
        // Assume it's a base64 or other format, convert to bytes
        const hashBuffer = Buffer.from(params.resolutionHash, 'utf8');
        resolutionHashBytes.set(hashBuffer.slice(0, 32));
      }

      // Build transaction
      const tx = await program.methods
        .resolveDisputeWithExplanation(params.buyerWins, Array.from(resolutionHashBytes))
        .accounts({
          arbitrator: arbitrator,
          seller: seller,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async defaultJudgment(params: DefaultJudgmentParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const arbitrator = new PublicKey(params.arbitratorAddress);
      const buyerTokenAccount = new PublicKey(params.buyerTokenAccount);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Build transaction
      const tx = await program.methods
        .defaultJudgment()
        .accounts({
          seller: seller,
          arbitrator: arbitrator,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  // Utility Operations
  async initializeBuyerBondAccount(params: InitializeBondParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const payer = new PublicKey(params.payerAddress);
      const tokenMint = new PublicKey(params.tokenMint);

      // Build transaction
      const tx = await program.methods
        .initializeBuyerBondAccount(new BN(params.escrowId), new BN(params.tradeId))
        .accounts({
          payer: payer,
          tokenMint: tokenMint,
          // tokenProgram: TOKEN_PROGRAM_ID,
          // systemProgram: SystemProgram.programId,
          // rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async initializeSellerBondAccount(params: InitializeBondParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const payer = new PublicKey(params.payerAddress);
      const tokenMint = new PublicKey(params.tokenMint);

      // Build transaction
      const tx = await program.methods
        .initializeSellerBondAccount(new BN(params.escrowId), new BN(params.tradeId))
        .accounts({
          payer: payer,
          tokenMint: tokenMint,
          // tokenProgram: TOKEN_PROGRAM_ID,
          // systemProgram: SystemProgram.programId,
          // rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async updateSequentialAddress(params: UpdateSequentialParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const buyer = new PublicKey(params.buyerAddress);

      // Build transaction
      const tx = await program.methods
        .updateSequentialAddress(new PublicKey(params.newSequentialAddress))
        .accounts({
          buyer: buyer,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  async autoCancel(params: AutoCancelParams): Promise<TransactionResult> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { provider, program } = await this.getProviderAndProgram();

      // Convert addresses to PublicKeys
      const arbitrator = new PublicKey(params.arbitratorAddress);
      const seller = new PublicKey(params.sellerAddress);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Build transaction
      const tx = await program.methods
        .autoCancel()
        .accounts({
          arbitrator: arbitrator,
          seller: seller,
          sellerTokenAccount: sellerTokenAccount,
          // tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();

      // Send transaction using Dynamic.xyz wallet
      const signature = await provider.sendAndConfirm(tx);

      return {
        success: true,
        signature,
        slot: await this.connection.getSlot(),
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
      };
    }
  }

  // State Queries
  async getEscrowState(escrowId: number, tradeId: number): Promise<EscrowState> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { program } = await this.getProviderAndProgram();

      // Derive PDA
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(this.programId, escrowId, tradeId);

      // Fetch account data
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);

      return {
        id: escrowAccount.escrowId.toNumber(),
        tradeId: escrowAccount.tradeId.toNumber(),
        state: this.mapEscrowState(escrowAccount.state),
        amount: escrowAccount.amount.toString(),
        sellerAddress: escrowAccount.seller.toString(),
        buyerAddress: escrowAccount.buyer.toString(),
        arbitratorAddress: escrowAccount.arbitrator.toString(),
        networkType: NetworkType.SOLANA,
      };
    } catch (error) {
      throw new Error(`Failed to fetch escrow state: ${this.handleError(error)}`);
    }
  }

  async getEscrowBalance(escrowId: number, tradeId: number): Promise<number> {
    try {
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(this.programId, escrowId, tradeId);

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Get token account info
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(escrowTokenPDA);
      return parseFloat(tokenAccountInfo.value.amount);
    } catch (error) {
      throw new Error(`Failed to fetch escrow balance: ${this.handleError(error)}`);
    }
  }

  // New methods that accept escrow address directly
  async getEscrowStateByAddress(escrowAddress: string): Promise<EscrowState> {
    try {
      // Get provider and program with Dynamic.xyz wallet
      const { program } = await this.getProviderAndProgram();

      // Use the provided escrow address directly
      const escrowPDA = new PublicKey(escrowAddress);

      // Fetch account data
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);

      return {
        id: escrowAccount.escrowId.toNumber(),
        tradeId: escrowAccount.tradeId.toNumber(),
        state: this.mapEscrowState(escrowAccount.state),
        amount: escrowAccount.amount.toString(),
        sellerAddress: escrowAccount.seller.toString(),
        buyerAddress: escrowAccount.buyer.toString(),
        arbitratorAddress: escrowAccount.arbitrator.toString(),
        depositDeadline: escrowAccount.depositDeadline.toNumber(),
        fiatDeadline: escrowAccount.fiatDeadline.toNumber(),
        fiatPaid: escrowAccount.fiatPaid,
        sequential: escrowAccount.sequential,
        sequentialEscrowAddress: escrowAccount.sequentialEscrowAddress?.toString() || '',
        networkType: NetworkType.SOLANA,
      };
    } catch (error) {
      throw new Error(`Failed to fetch escrow state: ${this.handleError(error)}`);
    }
  }

  async getEscrowBalanceByAddress(escrowAddress: string): Promise<number> {
    try {
      // Use the provided escrow address directly
      const escrowPDA = new PublicKey(escrowAddress);

      // Derive the token account PDA for this escrow
      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Get token account info
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(escrowTokenPDA);
      return parseFloat(tokenAccountInfo.value.amount);
    } catch (error) {
      throw new Error(`Failed to fetch escrow balance: ${this.handleError(error)}`);
    }
  }

  async getUsdcBalance(): Promise<number> {
    try {
      if (!this.dynamicWallet?.address) {
        throw new Error('Wallet not connected');
      }

      const walletPublicKey = new PublicKey(this.dynamicWallet.address);

      // Get the associated token account for USDC
      const associatedTokenAddress = await getAssociatedTokenAddress(
        this.usdcMint,
        walletPublicKey
      );

      // Get the token account info
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(associatedTokenAddress);

      if (!tokenAccountInfo.value) {
        return 0;
      }

      const balance = tokenAccountInfo.value.amount;

      // Return balance as number (in smallest unit - 6 decimals for USDC)
      return parseInt(balance);
    } catch (error) {
      console.error(`❌ [ERROR] Failed to get USDC balance:`, error);

      // If the token account doesn't exist, return 0 instead of throwing
      if (error instanceof Error && error.message.includes('could not find account')) {
        return 0;
      }

      throw new Error(this.handleError(error));
    }
  }

  // Helper Methods
  private mapEscrowState(
    state: number | string | any
  ): 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED' {
    // Map the Solana program state to our interface
    // Handle object states from Anchor (like { funded: true })
    if (typeof state === 'object' && state !== null) {
      if (state.created) return 'CREATED';
      if (state.funded) return 'FUNDED';
      if (state.released) return 'RELEASED';
      if (state.cancelled) return 'CANCELLED';
      if (state.disputed) return 'DISPUTED';
      if (state.resolved) return 'RESOLVED';
      return 'CREATED';
    }

    // Handle string states
    if (typeof state === 'string') {
      switch (state) {
        case 'Created':
          return 'CREATED';
        case 'Funded':
          return 'FUNDED';
        case 'Released':
          return 'RELEASED';
        case 'Cancelled':
          return 'CANCELLED';
        case 'Disputed':
          return 'DISPUTED';
        case 'Resolved':
          return 'RESOLVED';
        default:
          return 'CREATED';
      }
    }

    // Handle numeric states
    switch (state) {
      case 0:
        return 'CREATED';
      case 1:
        return 'FUNDED';
      case 2:
        return 'RELEASED';
      case 3:
        return 'CANCELLED';
      case 4:
        return 'DISPUTED';
      case 5:
        return 'RESOLVED';
      default:
        return 'CREATED';
    }
  }

  private handleError(error: unknown): string {
    // Handle Solana-specific errors
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'number') {
      // Anchor error codes
      const errorCode = error.code - 6000; // Anchor error offset
      switch (errorCode) {
        case 0:
          return 'Invalid amount: Zero or negative';
        case 1:
          return 'Amount exceeds maximum (100 USDC)';
        case 2:
          return 'Unauthorized caller';
        case 3:
          return 'Deposit deadline expired';
        case 4:
          return 'Fiat payment deadline expired';
        case 5:
          return 'Invalid state transition';
        case 6:
          return 'Missing sequential address';
        case 7:
          return 'Terminal state';
        case 8:
          return 'Fee calculation error';
        case 9:
          return 'Insufficient funds';
        case 10:
          return 'Incorrect bond amount';
        case 11:
          return 'Response deadline expired';
        case 12:
          return 'Invalid evidence hash';
        case 13:
          return 'Duplicate evidence';
        case 14:
          return 'Arbitration deadline expired';
        case 15:
          return 'Missing dispute bond';
        case 16:
          return 'Invalid resolution explanation';
        case 17:
          return 'Bump not found';
        default: {
          const message =
            error &&
            typeof error === 'object' &&
            'message' in error &&
            typeof error.message === 'string'
              ? error.message
              : 'Unknown error';
          return `Solana error: ${message}`;
        }
      }
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return error.message;
    }

    // Handle objects with message property
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return 'Unknown Solana error';
  }
}
