/**
 * Escrow Test Manager
 * Orchestrates comprehensive testing of the escrow lifecycle
 */

import { Keypair, PublicKey } from '@solana/web3.js';
import * as token from '@solana/spl-token';
import { UnifiedBlockchainService } from '../services/blockchainService.js';
import { PDADerivation } from '../blockchain/utils/pda.js';
import {
  TransactionResult,
  EscrowState,
  CreateEscrowParams,
  FundEscrowParams,
  MarkFiatPaidParams,
  ReleaseEscrowParams,
  CancelEscrowParams,
  OpenDisputeParams,
  RespondToDisputeParams,
  ResolveDisputeParams,
} from '../blockchain/types/index.js';

export interface EscrowTestState {
  currentStep: number;
  escrowId?: number;
  tradeId?: number;
  escrowAddress?: string;
  transactionResults: TransactionResult[];
  escrowState?: EscrowState;
  error?: string;
  isRunning: boolean;
  walletConnected: boolean;
  walletAddress?: string;
  testData?: {
    sellerWallet: Keypair;
    buyerWallet: Keypair;
    arbitratorAddress: string;
    sellerTokenAccount: string;
    buyerTokenAccount: string;
    arbitratorTokenAccount: string;
    amount: string;
  };
}

export interface TestStep {
  name: string;
  description: string;
  method: () => Promise<TransactionResult>;
  expectedState?: string;
}

export class EscrowTestManager {
  private blockchainService: UnifiedBlockchainService;
  private testState: EscrowTestState;
  private onStateUpdate?: (state: EscrowTestState) => void;
  private walletAddress?: string;

  constructor(
    blockchainService: UnifiedBlockchainService,
    walletAddress?: string,
    onStateUpdate?: (state: EscrowTestState) => void
  ) {
    this.blockchainService = blockchainService;
    this.walletAddress = walletAddress;
    this.onStateUpdate = onStateUpdate;
    this.testState = {
      currentStep: 0,
      transactionResults: [],
      isRunning: false,
      walletConnected: !!walletAddress,
      walletAddress,
    };
  }

  private updateState(updates: Partial<EscrowTestState>): void {
    this.testState = { ...this.testState, ...updates };
    this.onStateUpdate?.(this.testState);
  }

  async checkWalletConnection(): Promise<boolean> {
    try {
      const isConnected = !!this.walletAddress;

      this.updateState({
        walletConnected: isConnected,
        walletAddress: this.walletAddress,
      });

      return isConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      this.updateState({ walletConnected: false });
      return false;
    }
  }

  updateWalletAddress(walletAddress?: string): void {
    this.walletAddress = walletAddress;
    this.updateState({
      walletConnected: !!walletAddress,
      walletAddress,
    });
  }

  private generateRandomId(): number {
    return Math.floor(Math.random() * 1000000) + 1;
  }

  private deriveEscrowAddress(escrowId: number, tradeId: number): string {
    // Use the actual program ID from the transaction analysis
    const programId = new PublicKey('4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x');
    const [escrowPDA] = PDADerivation.deriveEscrowPDA(programId, escrowId, tradeId);
    return escrowPDA.toString();
  }

  private deriveAssociatedTokenAccount(walletAddress: string, mintAddress: string): string {
    // Derive the associated token account address
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);

    const [associatedTokenAccount] = PublicKey.findProgramAddressSync(
      [wallet.toBuffer(), token.TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      token.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return associatedTokenAccount.toString();
  }

  private async waitForTransactionConfirmation(
    signature: string,
    waitTimeSeconds: number = 10
  ): Promise<void> {
    console.log('⏳ [DEBUG] Waiting for transaction confirmation...');
    console.log('  - Signature:', signature);
    console.log(`  - Wait time: ${waitTimeSeconds} seconds`);

    await new Promise(resolve => setTimeout(resolve, waitTimeSeconds * 1000));

    console.log('✅ [DEBUG] Transaction confirmation wait completed');
  }

  private generateEvidenceHash(evidence: string): string {
    // Simple hash generation for testing - using a simple hash function
    let hash = 0;
    for (let i = 0; i < evidence.length; i++) {
      const char = evidence.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(8).slice(0, 64);
  }

  private async logStep(stepName: string, result: TransactionResult): Promise<void> {
    console.log(`🧪 ${stepName}:`, result.success ? '✅ Success' : '❌ Failed');
    if (result.signature) {
      console.log(`   Transaction: ${result.signature}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  private async verifyEscrowState(expectedState: string): Promise<boolean> {
    if (!this.testState.escrowId || !this.testState.tradeId) {
      throw new Error('No escrow ID or trade ID available for state verification');
    }

    console.log('🔍 [DEBUG] Verifying escrow state:');
    console.log('  - Escrow ID:', this.testState.escrowId);
    console.log('  - Trade ID:', this.testState.tradeId);
    console.log('  - Expected State:', expectedState);
    console.log('  - Escrow Address (from state):', this.testState.escrowAddress);

    try {
      console.log('🚀 [DEBUG] Calling blockchainService.getEscrowState...');
      const state = await this.blockchainService.getEscrowState(
        this.testState.escrowId,
        this.testState.tradeId
      );

      console.log('📊 [DEBUG] State verification results:');
      console.log(`  - Current State: ${state.state}`);
      console.log(`  - Expected State: ${expectedState}`);
      console.log(`  - State Match: ${state.state === expectedState}`);
      console.log('🔍 [DEBUG] Full state object:', JSON.stringify(state, null, 2));

      // Only try to get balance if the escrow is funded or we expect it to be funded
      if (state.state === 'FUNDED' || expectedState === 'FUNDED') {
        console.log('🚀 [DEBUG] Calling blockchainService.getEscrowBalance...');
        const balance = await this.blockchainService.getEscrowBalance(
          this.testState.escrowId,
          this.testState.tradeId
        );
        console.log(`  - Balance: ${balance} USDC`);
      } else {
        console.log('  - Balance: N/A (escrow not funded yet)');
      }

      this.updateState({ escrowState: state });
      return state.state === expectedState;
    } catch (error) {
      console.error('❌ [DEBUG] State verification failed:', error);
      console.error('  - Error details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('  - Escrow ID:', this.testState.escrowId);
      console.error('  - Trade ID:', this.testState.tradeId);
      return false;
    }
  }

  async initializeTestData(): Promise<void> {
    try {
      // Check wallet connection first
      const isWalletConnected = await this.checkWalletConnection();
      if (!isWalletConnected) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      // Use the connected wallet as the seller (primary user)
      const connectedWalletAddress = this.walletAddress;
      if (!connectedWalletAddress) {
        throw new Error('No wallet address available');
      }

      // Generate test wallets for buyer and arbitrator
      const buyerWallet = Keypair.generate();

      // Use a known arbitrator address (you can replace this with a real one)
      const arbitratorAddress = '11111111111111111111111111111112'; // System program as placeholder

      // Derive associated token account addresses for USDC on devnet
      const usdcMintAddress = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // Devnet USDC

      const sellerTokenAccount = this.deriveAssociatedTokenAccount(
        connectedWalletAddress,
        usdcMintAddress
      );
      const buyerTokenAccount = this.deriveAssociatedTokenAccount(
        buyerWallet.publicKey.toString(),
        usdcMintAddress
      );
      const arbitratorTokenAccount = this.deriveAssociatedTokenAccount(
        arbitratorAddress,
        usdcMintAddress
      );

      // Create a dummy seller wallet for the test data structure
      const sellerWallet = Keypair.generate();
      // Create a new keypair with the connected wallet address
      const sellerWalletWithAddress = {
        ...sellerWallet,
        publicKey: new PublicKey(connectedWalletAddress),
      } as Keypair;

      const testData = {
        sellerWallet: sellerWalletWithAddress,
        buyerWallet,
        arbitratorAddress,
        sellerTokenAccount,
        buyerTokenAccount,
        arbitratorTokenAccount,
        amount: '10000000', // 10 USDC (6 decimals)
      };

      this.updateState({ testData });
      console.log('✅ Test data initialized with connected wallet:', connectedWalletAddress);
      console.log('🔍 [DEBUG] Derived token account addresses:');
      console.log('  - Seller Token Account:', sellerTokenAccount);
      console.log('  - Buyer Token Account:', buyerTokenAccount);
      console.log('  - Arbitrator Token Account:', arbitratorTokenAccount);
      console.log('  - USDC Mint:', usdcMintAddress);
    } catch (error) {
      console.error('❌ Failed to initialize test data:', error);
      throw error;
    }
  }

  async createEscrow(): Promise<TransactionResult> {
    if (!this.testState.testData) {
      throw new Error('Test data not initialized');
    }

    const escrowId = this.generateRandomId();
    const tradeId = this.generateRandomId();

    console.log('🔍 [DEBUG] Creating escrow with parameters:');
    console.log('  - Escrow ID:', escrowId);
    console.log('  - Trade ID:', tradeId);
    console.log('  - Amount:', this.testState.testData.amount);
    console.log('  - Seller Address:', this.testState.testData.sellerWallet.publicKey.toString());
    console.log('  - Buyer Address:', this.testState.testData.buyerWallet.publicKey.toString());
    console.log('  - Arbitrator Address:', this.testState.testData.arbitratorAddress);

    const params: CreateEscrowParams = {
      escrowId,
      tradeId,
      amount: this.testState.testData.amount,
      sellerAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      buyerAddress: this.testState.testData.buyerWallet.publicKey.toString(),
      arbitratorAddress: this.testState.testData.arbitratorAddress,
      sequential: false,
      sequentialEscrowAddress: undefined,
      depositDeadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      fiatDeadline: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
    };

    try {
      console.log('🚀 [DEBUG] Calling blockchainService.createEscrow...');
      const result = await this.blockchainService.createEscrow(params);

      console.log('📊 [DEBUG] Create escrow result:', {
        success: result.success,
        error: result.error,
        signature: result.signature,
        transactionHash: result.transactionHash,
      });

      if (result.success) {
        console.log('✅ [DEBUG] Escrow created successfully!');
        console.log('  - Transaction Signature:', result.signature || result.transactionHash);

        // Derive the escrow address using PDA derivation
        const escrowAddress = this.deriveEscrowAddress(escrowId, tradeId);
        console.log('  - Derived Escrow Address:', escrowAddress);

        this.updateState({
          escrowId,
          tradeId,
          escrowAddress,
          transactionResults: [...this.testState.transactionResults, result],
        });
      } else {
        console.log('❌ [DEBUG] Escrow creation failed:', result.error);
      }

      await this.logStep('Create Escrow', result);
      return result;
    } catch (error) {
      console.log('💥 [DEBUG] Create escrow exception:', error);
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Create Escrow', errorResult);
      return errorResult;
    }
  }

  async fundEscrow(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    console.log('🔍 [DEBUG] Funding escrow with parameters:');
    console.log('  - Escrow ID:', this.testState.escrowId);
    console.log('  - Trade ID:', this.testState.tradeId);
    console.log('  - Amount:', this.testState.testData.amount);
    console.log('  - Seller Address:', this.testState.testData.sellerWallet.publicKey.toString());
    console.log('  - Seller Token Account:', this.testState.testData.sellerTokenAccount);
    console.log('  - Escrow Address (from state):', this.testState.escrowAddress);

    // Check seller's USDC balance before funding
    try {
      const sellerBalance = await this.blockchainService.getWalletBalance();
      console.log('🔍 [DEBUG] Seller USDC balance before funding:', {
        balance: sellerBalance,
        amount: this.testState.testData.amount,
        sufficient: sellerBalance >= parseInt(this.testState.testData.amount.toString()),
      });
    } catch (error) {
      console.log('🔍 [DEBUG] Failed to get seller balance:', error);
    }

    const params: FundEscrowParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      amount: this.testState.testData.amount,
      sellerAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      sellerTokenAccount: this.testState.testData.sellerTokenAccount,
    };

    try {
      console.log('🚀 [DEBUG] Calling blockchainService.fundEscrow...');
      const result = await this.blockchainService.fundEscrow(params);

      console.log('📊 [DEBUG] Fund escrow result:', {
        success: result.success,
        error: result.error,
        signature: result.signature,
        transactionHash: result.transactionHash,
      });

      if (result.success) {
        console.log('✅ [DEBUG] Escrow funded successfully!');
        console.log('  - Transaction Signature:', result.signature || result.transactionHash);
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      } else {
        console.log('❌ [DEBUG] Escrow funding failed:', result.error);
      }

      await this.logStep('Fund Escrow', result);
      return result;
    } catch (error) {
      console.log('💥 [DEBUG] Fund escrow exception:', error);
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Fund Escrow', errorResult);
      return errorResult;
    }
  }

  async markFiatPaid(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    const params: MarkFiatPaidParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      buyerAddress: this.testState.testData.buyerWallet.publicKey.toString(),
    };

    try {
      const result = await this.blockchainService.markFiatPaid(params);
      await this.logStep('Mark Fiat Paid', result);

      if (result.success) {
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      }

      return result;
    } catch (error) {
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Mark Fiat Paid', errorResult);
      return errorResult;
    }
  }

  async releaseEscrow(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    const params: ReleaseEscrowParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      authorityAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      buyerTokenAccount: this.testState.testData.buyerTokenAccount,
      arbitratorTokenAccount: this.testState.testData.arbitratorTokenAccount,
      sequentialEscrowTokenAccount: undefined,
    };

    try {
      const result = await this.blockchainService.releaseEscrow(params);
      await this.logStep('Release Escrow', result);

      if (result.success) {
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      }

      return result;
    } catch (error) {
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Release Escrow', errorResult);
      return errorResult;
    }
  }

  async openDispute(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    const evidenceHash = this.generateEvidenceHash('Buyer dispute evidence');

    const params: OpenDisputeParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      disputingPartyAddress: this.testState.testData.buyerWallet.publicKey.toString(),
      disputingPartyTokenAccount: this.testState.testData.buyerTokenAccount,
      evidenceHash,
      bondAmount: '1000000', // 1 USDC bond
    };

    try {
      const result = await this.blockchainService.openDispute(params);
      await this.logStep('Open Dispute', result);

      if (result.success) {
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      }

      return result;
    } catch (error) {
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Open Dispute', errorResult);
      return errorResult;
    }
  }

  async respondToDispute(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    const evidenceHash = this.generateEvidenceHash('Seller response evidence');

    const params: RespondToDisputeParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      respondingPartyAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      respondingPartyTokenAccount: this.testState.testData.sellerTokenAccount,
      evidenceHash,
      bondAmount: '1000000', // 1 USDC bond
    };

    try {
      const result = await this.blockchainService.respondToDispute(params);
      await this.logStep('Respond to Dispute', result);

      if (result.success) {
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      }

      return result;
    } catch (error) {
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Respond to Dispute', errorResult);
      return errorResult;
    }
  }

  async resolveDispute(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    const resolutionHash = this.generateEvidenceHash('Arbitrator resolution');

    const params: ResolveDisputeParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      arbitratorAddress: this.testState.testData.arbitratorAddress,
      sellerAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      buyerTokenAccount: this.testState.testData.buyerTokenAccount,
      sellerTokenAccount: this.testState.testData.sellerTokenAccount,
      arbitratorTokenAccount: this.testState.testData.arbitratorTokenAccount,
      buyerWins: true,
      resolutionHash,
      resolutionExplanation: 'Test resolution: Buyer wins due to evidence provided',
    };

    try {
      const result = await this.blockchainService.resolveDispute(params);
      await this.logStep('Resolve Dispute', result);

      if (result.success) {
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      }

      return result;
    } catch (error) {
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Resolve Dispute', errorResult);
      return errorResult;
    }
  }

  async cancelEscrow(): Promise<TransactionResult> {
    if (!this.testState.escrowId || !this.testState.tradeId || !this.testState.testData) {
      throw new Error('Escrow not created or test data not available');
    }

    const params: CancelEscrowParams = {
      escrowId: this.testState.escrowId,
      tradeId: this.testState.tradeId,
      sellerAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      authorityAddress: this.testState.testData.sellerWallet.publicKey.toString(),
      sellerTokenAccount: this.testState.testData.sellerTokenAccount,
    };

    try {
      const result = await this.blockchainService.cancelEscrow(params);
      await this.logStep('Cancel Escrow', result);

      if (result.success) {
        this.updateState({
          transactionResults: [...this.testState.transactionResults, result],
        });
      }

      return result;
    } catch (error) {
      const errorResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      await this.logStep('Cancel Escrow', errorResult);
      return errorResult;
    }
  }

  async verifyState(expectedState: string): Promise<boolean> {
    return await this.verifyEscrowState(expectedState);
  }

  async runCompleteLifecycleTest(): Promise<void> {
    this.updateState({ isRunning: true, currentStep: 0, error: undefined });

    try {
      console.log('🚀 Starting complete escrow lifecycle test...');

      // Initialize test data
      await this.initializeTestData();
      this.updateState({ currentStep: 1 });

      // Step 1: Create Escrow
      console.log('🔄 [DEBUG] Starting Step 1: Create Escrow');
      const createResult = await this.createEscrow();
      if (!createResult.success) {
        throw new Error(`Create escrow failed: ${createResult.error}`);
      }

      // Wait for transaction confirmation
      if (createResult.signature) {
        await this.waitForTransactionConfirmation(createResult.signature, 10);
      }

      console.log('🔄 [DEBUG] Verifying escrow state after creation...');
      await this.verifyState('CREATED');
      this.updateState({ currentStep: 2 });

      // Additional wait for blockchain to process the creation
      console.log('⏳ [DEBUG] Waiting 5 seconds for blockchain to process escrow creation...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Step 2: Fund Escrow
      console.log('🔄 [DEBUG] Starting Step 2: Fund Escrow');
      const fundResult = await this.fundEscrow();
      if (!fundResult.success) {
        throw new Error(`Fund escrow failed: ${fundResult.error}`);
      }
      // Wait a bit for the blockchain to process the funding transaction
      console.log('⏳ [DEBUG] Waiting 3 seconds for blockchain to process funding...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🔄 [DEBUG] Verifying escrow state after funding...');
      await this.verifyState('FUNDED');
      this.updateState({ currentStep: 3 });

      // Step 3: Mark Fiat Paid
      const fiatResult = await this.markFiatPaid();
      if (!fiatResult.success) {
        throw new Error(`Mark fiat paid failed: ${fiatResult.error}`);
      }
      await this.verifyState('FUNDED'); // State doesn't change
      this.updateState({ currentStep: 4 });

      // Step 4: Release Escrow
      const releaseResult = await this.releaseEscrow();
      if (!releaseResult.success) {
        throw new Error(`Release escrow failed: ${releaseResult.error}`);
      }
      await this.verifyState('RELEASED');
      this.updateState({ currentStep: 5 });

      console.log('✅ Complete lifecycle test passed!');
      this.updateState({ isRunning: false });
    } catch (error) {
      console.error('❌ Test failed:', error);
      this.updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isRunning: false,
      });
      await this.cleanup();
    }
  }

  async runDisputeWorkflowTest(): Promise<void> {
    this.updateState({ isRunning: true, currentStep: 0, error: undefined });

    try {
      console.log('🚀 Starting dispute workflow test...');

      // Initialize test data
      await this.initializeTestData();
      this.updateState({ currentStep: 1 });

      // Create and fund escrow
      const createResult = await this.createEscrow();
      if (!createResult.success) {
        throw new Error(`Create escrow failed: ${createResult.error}`);
      }
      await this.verifyState('CREATED');
      this.updateState({ currentStep: 2 });

      const fundResult = await this.fundEscrow();
      if (!fundResult.success) {
        throw new Error(`Fund escrow failed: ${fundResult.error}`);
      }
      await this.verifyState('FUNDED');
      this.updateState({ currentStep: 3 });

      // Open dispute
      const disputeResult = await this.openDispute();
      if (!disputeResult.success) {
        throw new Error(`Open dispute failed: ${disputeResult.error}`);
      }
      await this.verifyState('DISPUTED');
      this.updateState({ currentStep: 4 });

      // Respond to dispute
      const respondResult = await this.respondToDispute();
      if (!respondResult.success) {
        throw new Error(`Respond to dispute failed: ${respondResult.error}`);
      }
      await this.verifyState('DISPUTED');
      this.updateState({ currentStep: 5 });

      // Resolve dispute
      const resolveResult = await this.resolveDispute();
      if (!resolveResult.success) {
        throw new Error(`Resolve dispute failed: ${resolveResult.error}`);
      }
      await this.verifyState('RESOLVED');
      this.updateState({ currentStep: 6 });

      console.log('✅ Dispute workflow test passed!');
      this.updateState({ isRunning: false });
    } catch (error) {
      console.error('❌ Dispute test failed:', error);
      this.updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isRunning: false,
      });
      await this.cleanup();
    }
  }

  async cleanup(): Promise<void> {
    if (!this.testState.escrowId || !this.testState.tradeId) {
      return;
    }

    try {
      console.log('🧹 Cleaning up test escrow...');

      // Try to cancel escrow if it's in a cancellable state
      if (
        this.testState.escrowState &&
        ['CREATED', 'FUNDED'].includes(this.testState.escrowState.state)
      ) {
        await this.cancelEscrow();
      }

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error);
    }
  }

  getState(): EscrowTestState {
    return this.testState;
  }
}
