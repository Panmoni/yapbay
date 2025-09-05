/**
 * Solana Program Interface
 * Integrates with the YapBay escrow program using Anchor
 */

import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, Connection, Keypair, SYSVAR_RENT_PUBKEY, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
    this.program = new Program(idl as any, this.provider);
  }

  // Update wallet when Dynamic.xyz wallet changes
  updateWallet(wallet: any): void {
    this.provider = new AnchorProvider(this.connection, wallet, { commitment: 'confirmed' });
    this.program = new Program(idl as any, this.provider);
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

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const buyer = new PublicKey(params.buyerAddress);

      // Build transaction
      const tx = await this.program.methods
        .creatEscrow(
          new BN(params.escrowId),
          new BN(params.tradeId),
          new BN(params.amount),
          params.sequential || false,
          params.sequentialEscrowAddress ? new PublicKey(params.sequentialEscrowAddress) : null
        )
        .accounts({
          seller: seller,
          buyer: buyer,
          escrow: escrowPDA,
          system_program: SystemProgram.programId,
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

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Get USDC mint from network config
      const usdcMint = new PublicKey(
        this.provider.connection.rpcEndpoint.includes('devnet')
          ? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Devnet USDC
          : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Mainnet USDC
      );

      // Build transaction
      const tx = await this.program.methods
        .fundEscrow()
        .accounts({
          seller: seller,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
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

      // Convert addresses to PublicKeys
      const buyer = new PublicKey(params.buyerAddress);

      // Build transaction
      const tx = await this.program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer,
          escrow: escrowPDA,
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

      // Convert addresses to PublicKeys
      const authority = new PublicKey(params.authorityAddress);
      const buyerTokenAccount = new PublicKey(params.buyerTokenAccount);
      const arbitratorTokenAccount = new PublicKey(params.arbitratorTokenAccount);
      const sequentialEscrowTokenAccount = params.sequentialEscrowTokenAccount
        ? new PublicKey(params.sequentialEscrowTokenAccount)
        : null;

      // Build transaction
      const tx = await this.program.methods
        .releaseEscrow()
        .accounts({
          authority: authority,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: sequentialEscrowTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
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

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const authority = new PublicKey(params.authorityAddress);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Build transaction
      const tx = await this.program.methods
        .cancelEscrow()
        .accounts({
          seller: seller,
          authority: authority,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          sellerTokenAccount: sellerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
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
      const [sellerBondPDA] = PDADerivation.deriveSellerBondPDA(this.programId, escrowPDA);

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
      const tx = await this.program.methods
        .openDisputeWithBond(Array.from(evidenceHashBytes))
        .accounts({
          disputingParty: disputingParty,
          escrow: escrowPDA,
          disputingPartyTokenAccount: disputingPartyTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
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

      const [buyerBondPDA] = PDADerivation.deriveBuyerBondPDA(this.programId, escrowPDA);
      const [sellerBondPDA] = PDADerivation.deriveSellerBondPDA(this.programId, escrowPDA);

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
      const tx = await this.program.methods
        .respondToDisputeWithBond(Array.from(evidenceHashBytes))
        .accounts({
          respondingParty: respondingParty,
          escrow: escrowPDA,
          respondingPartyTokenAccount: respondingPartyTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
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

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);
      const [buyerBondPDA] = PDADerivation.deriveBuyerBondPDA(this.programId, escrowPDA);
      const [sellerBondPDA] = PDADerivation.deriveSellerBondPDA(this.programId, escrowPDA);

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
      const tx = await this.program.methods
        .resolveDisputeWithExplanation(params.buyerWins, Array.from(resolutionHashBytes))
        .accounts({
          arbitrator: arbitrator,
          seller: seller,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
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

  async defaultJudgment(params: DefaultJudgmentParams): Promise<TransactionResult> {
    try {
      // Derive PDAs
      const [escrowPDA] = PDADerivation.deriveEscrowPDA(
        this.programId,
        params.escrowId,
        params.tradeId
      );

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);
      const [buyerBondPDA] = PDADerivation.deriveBuyerBondPDA(this.programId, escrowPDA);
      const [sellerBondPDA] = PDADerivation.deriveSellerBondPDA(this.programId, escrowPDA);

      // Convert addresses to PublicKeys
      const seller = new PublicKey(params.sellerAddress);
      const arbitrator = new PublicKey(params.arbitratorAddress);
      const buyerTokenAccount = new PublicKey(params.buyerTokenAccount);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Build transaction
      const tx = await this.program.methods
        .defaultJudgment()
        .accounts({
          seller: seller,
          arbitrator: arbitrator,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
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

      // Convert addresses to PublicKeys
      const payer = new PublicKey(params.payerAddress);
      const tokenMint = new PublicKey(params.tokenMint);

      // Build transaction
      const tx = await this.program.methods
        .initializeBuyerBondAccount(new BN(params.escrowId), new BN(params.tradeId))
        .accounts({
          payer: payer,
          escrow: escrowPDA,
          buyerBondAccount: buyerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
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

      // Convert addresses to PublicKeys
      const payer = new PublicKey(params.payerAddress);
      const tokenMint = new PublicKey(params.tokenMint);

      // Build transaction
      const tx = await this.program.methods
        .initializeSellerBondAccount(new BN(params.escrowId), new BN(params.tradeId))
        .accounts({
          payer: payer,
          escrow: escrowPDA,
          sellerBondAccount: sellerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
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

      // Convert addresses to PublicKeys
      const buyer = new PublicKey(params.buyerAddress);

      // Build transaction
      const tx = await this.program.methods
        .updateSequentialAddress(new PublicKey(params.newSequentialAddress))
        .accounts({
          buyer: buyer,
          escrow: escrowPDA,
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

      const [escrowTokenPDA] = PDADerivation.deriveEscrowTokenPDA(this.programId, escrowPDA);

      // Convert addresses to PublicKeys
      const arbitrator = new PublicKey(params.arbitratorAddress);
      const seller = new PublicKey(params.sellerAddress);
      const sellerTokenAccount = new PublicKey(params.sellerTokenAccount);

      // Build transaction
      const tx = await this.program.methods
        .autoCancel()
        .accounts({
          arbitrator: arbitrator,
          seller: seller,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          sellerTokenAccount: sellerTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
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
