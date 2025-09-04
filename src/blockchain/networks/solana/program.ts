/**
 * Solana Program Interface
 * Integrates with the YapBay escrow program using Anchor
 */

import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey, Transaction, Connection, Keypair } from '@solana/web3.js';
import { LocalsolanaContracts } from '../../../contracts/solana/idl.json';
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
  InitializeBondParams,
  UpdateSequentialParams,
  AutoCancelParams,
  EscrowState,
  TransactionResult,
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
}

export class SolanaProgram implements SolanaProgramInterface {
  private program: Program<LocalsolanaContracts>;
  private provider: AnchorProvider;
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey, wallet?: any) {
    this.connection = connection;
    this.programId = programId;

    // Create provider (wallet will be set by Dynamic.xyz)
    this.provider = new AnchorProvider(
      connection,
      wallet || new Keypair(), // Fallback for testing
      { commitment: 'confirmed' }
    );

    // Initialize program
    this.program = new Program(LocalsolanaContracts, programId, this.provider);
  }

  // Update wallet when Dynamic.xyz wallet changes
  updateWallet(wallet: any): void {
    this.provider = new AnchorProvider(this.connection, wallet, { commitment: 'confirmed' });
    this.program = new Program(LocalsolanaContracts, this.programId, this.provider);
  }

  // Core Escrow Operations
  async createEscrow(params: CreateEscrowParams): Promise<TransactionResult> {
    try {
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const buyer = new PublicKey(params.buyerAddress);
      const arbitrator = new PublicKey(params.arbitratorAddress);

      // Build transaction
      const tx = await this.program.methods
        .createEscrow(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          seller,
          buyer,
          arbitrator,
          new web3.BN(params.amount),
          new web3.BN(params.depositDeadline),
          new web3.BN(params.fiatDeadline),
          params.sequential || false,
          params.sequentialEscrowAddress ? new PublicKey(params.sequentialEscrowAddress) : null
        )
        .accounts({
          escrow: escrowPDA,
          escrowToken: escrowTokenPDA,
          seller: seller,
          arbitrator: arbitrator,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: web3.TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Get USDC mint from network config
      const usdcMint = new PublicKey(
        this.provider.connection.rpcEndpoint.includes('devnet')
          ? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Devnet USDC
          : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Mainnet USDC
      );

      // Build transaction
      const tx = await this.program.methods
        .fundEscrow(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          new web3.BN(params.amount)
        )
        .accounts({
          escrow: escrowPDA,
          escrowToken: escrowTokenPDA,
          usdcMint: usdcMint,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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

  async markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult> {
    try {
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      // Build transaction
      const tx = await this.program.methods
        .markFiatPaid(new web3.BN(params.escrowId), new web3.BN(params.tradeId))
        .accounts({
          escrow: escrowPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Build transaction
      const tx = await this.program.methods
        .releaseEscrow(new web3.BN(params.escrowId), new web3.BN(params.tradeId))
        .accounts({
          escrow: escrowPDA,
          escrowToken: escrowTokenPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Build transaction
      const tx = await this.program.methods
        .cancelEscrow(new web3.BN(params.escrowId), new web3.BN(params.tradeId))
        .accounts({
          escrow: escrowPDA,
          escrowToken: escrowTokenPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [buyerBondPDA] = PDADerivation.deriveBuyerBondPDA(this.programId, escrowPDA);

      // Build transaction
      const tx = await this.program.methods
        .openDisputeWithBond(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          params.evidenceHash,
          new web3.BN(params.bondAmount)
        )
        .accounts({
          escrow: escrowPDA,
          buyerBond: buyerBondPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [sellerBondPDA] = PDADerivation.deriveSellerBondPDA(this.programId, escrowPDA);

      // Build transaction
      const tx = await this.program.methods
        .respondToDisputeWithBond(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          params.evidenceHash,
          new web3.BN(params.bondAmount)
        )
        .accounts({
          escrow: escrowPDA,
          sellerBond: sellerBondPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      // Build transaction
      const tx = await this.program.methods
        .resolveDisputeWithExplanation(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          params.resolutionExplanation,
          params.buyerWins
        )
        .accounts({
          escrow: escrowPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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

  async defaultJudgment(params: AutoCancelParams): Promise<TransactionResult> {
    try {
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      // Build transaction
      const tx = await this.program.methods
        .defaultJudgment(new web3.BN(params.escrowId), new web3.BN(params.tradeId))
        .accounts({
          escrow: escrowPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [buyerBondPDA] = PDADerivation.deriveBuyerBondPDA(this.programId, escrowPDA);

      // Build transaction
      const tx = await this.program.methods
        .initializeBuyerBondAccount(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          new web3.BN(params.bondAmount)
        )
        .accounts({
          escrow: escrowPDA,
          buyerBond: buyerBondPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [sellerBondPDA] = PDADerivation.deriveSellerBondPDA(this.programId, escrowPDA);

      // Build transaction
      const tx = await this.program.methods
        .initializeSellerBondAccount(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          new web3.BN(params.bondAmount)
        )
        .accounts({
          escrow: escrowPDA,
          sellerBond: sellerBondPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      // Build transaction
      const tx = await this.program.methods
        .updateSequentialAddress(
          new web3.BN(params.escrowId),
          new web3.BN(params.tradeId),
          new PublicKey(params.newSequentialAddress)
        )
        .accounts({
          escrow: escrowPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      // Build transaction
      const tx = await this.program.methods
        .autoCancel(new web3.BN(params.escrowId), new web3.BN(params.tradeId))
        .accounts({
          escrow: escrowPDA,
          // Additional accounts will be added by Anchor automatically
        })
        .transaction();

      // Send transaction
      const signature = await this.provider.sendAndConfirm(tx);

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
      // Derive PDA
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(this.programId, escrowId, tradeId);

      // Fetch account data
      const escrowAccount = await this.program.account.escrow.fetch(escrowPDA);

      return {
        id: escrowAccount.escrowId.toNumber(),
        tradeId: escrowAccount.tradeId.toNumber(),
        state: this.mapEscrowState(escrowAccount.state),
        amount: escrowAccount.amount.toString(),
        sellerAddress: escrowAccount.seller.toString(),
        buyerAddress: escrowAccount.buyer.toString(),
        arbitratorAddress: escrowAccount.arbitrator.toString(),
        networkType: 'solana' as const,
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

  // Helper Methods
  private mapEscrowState(
    state: any
  ): 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED' {
    // Map the Solana program state to our interface
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

  private handleError(error: any): string {
    // Handle Solana-specific errors
    if (error.code) {
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
        default:
          return `Solana error: ${error.message || 'Unknown error'}`;
      }
    }
    return error.message || 'Unknown Solana error';
  }
}
