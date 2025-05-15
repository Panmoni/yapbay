import { 
  Address, 
  parseUnits, 
  formatUnits, 
  decodeEventLog as viemDecodeEventLog,
  PublicClient,
  WalletClient,
  Abi,
  Log,
  TransactionReceiptWithId,
  erc20Abi as viemErc20Abi 
} from 'viem';
import {
  IEscrowPlatformSDK,
  EscrowCreationParams,
  CreateEscrowResult,
  EscrowDetails,
  GenericWallet,
  ChainAgnosticAddress,
  ChainAgnosticAmount,
  ChainAgnosticId,
  TokenAllowanceParams,
  ApproveTokenSpendingParams,
  FundEscrowParams,
  MarkFiatPaidParams,
  ReleaseEscrowParams,
  DisputeEscrowParams,
  CancelEscrowParams,
  TransactionResult
} from '../interface';

// IMPORTANT: This file expects YapBayEscrow.abi.json to be in the same directory (src/sdk/celo/).
import YapBayEscrowABIFile from './YapBayEscrow.abi.json'; 

// Define a more specific type for the event arguments if available from your contract types
interface EscrowCreatedEventArgs {
  escrowId: bigint;
  tradeId: bigint;
  seller: Address;
  buyer: Address;
  arbitrator: Address;
  amount: bigint;
  deposit_deadline: bigint;
  fiat_deadline: bigint;
  sequential: boolean;
  sequential_escrow_address: Address;
  timestamp: bigint;
}

export interface CeloSDKConfig {
  escrowContractAddress: Address;
  usdcTokenAddress: Address; 
  arbitratorAddress: Address;
  usdcDecimals?: number;
}

const DEFAULT_USDC_DECIMALS = 6;

export class CeloEscrowSDK implements IEscrowPlatformSDK {
  private config: CeloSDKConfig;
  private escrowContractABI: Abi;

  constructor(config: CeloSDKConfig) {
    this.config = {
      ...config,
      usdcDecimals: config.usdcDecimals || DEFAULT_USDC_DECIMALS,
    };
    this.escrowContractABI = YapBayEscrowABIFile.abi as Abi;

    if (!this.config.escrowContractAddress || !this.config.usdcTokenAddress || !this.config.arbitratorAddress) {
      throw new Error('CeloEscrowSDK: Missing required config: escrowContractAddress, usdcTokenAddress, arbitratorAddress.');
    }
  }

  private async getWalletClient(wallet: GenericWallet): Promise<WalletClient> {
    if (!wallet.getWalletClient) {
      throw new Error('CeloEscrowSDK: Wallet does not provide getWalletClient method.');
    }
    const walletClient = await wallet.getWalletClient();
    if (!walletClient || !walletClient.account) {
        throw new Error('CeloEscrowSDK: Failed to get wallet client or client account from wallet.');
    }
    return walletClient as WalletClient;
  }

  private async getPublicClient(wallet: GenericWallet): Promise<PublicClient> {
    if (!wallet.getPublicClient) {
      throw new Error('CeloEscrowSDK: Wallet does not provide getPublicClient method.');
    }
    const publicClient = await wallet.getPublicClient();
    if (!publicClient) {
        throw new Error('CeloEscrowSDK: Failed to get public client from wallet.');
    }
    return publicClient as PublicClient;
  }

  async createEscrow(wallet: GenericWallet, params: EscrowCreationParams): Promise<CreateEscrowResult> {
    const walletClient = await this.getWalletClient(wallet);
    const publicClient = await this.getPublicClient(wallet);

    const amountInSmallestUnit = this.toSmallestUnit(
        params.amount,
        this.config.usdcDecimals!
    );

    const sequential = params.sequential || false;
    const sequentialEscrowAddress = 
        params.sequentialEscrowAddress || ('0x0000000000000000000000000000000000000000' as Address);
    // Note: Current YapBayEscrow.sol's createEscrow doesn't take arbitrator as an argument.
    // It's set globally in the contract or derived. Arbitrator in params is for future flexibility.

    console.log('[CeloSDK.createEscrow] Creating escrow with:', {
      tradeId: BigInt(params.tradeId.toString()),
      buyer: params.buyerAddress,
      amount: amountInSmallestUnit.toString(),
      sequential,
      sequentialEscrowAddress,
    });

    try {
      if (!walletClient.account) {
        throw new Error('CeloEscrowSDK: Wallet client account is unexpectedly undefined in createEscrow.');
      }

      const accountForSimulate: Address = typeof walletClient.account === 'string' 
        ? walletClient.account 
        : walletClient.account.address;

      const { request } = await publicClient.simulateContract({
        address: this.config.escrowContractAddress,
        abi: this.escrowContractABI,
        functionName: 'createEscrow',
        args: [
          BigInt(params.tradeId.toString()), 
          params.buyerAddress as Address, 
          BigInt(amountInSmallestUnit),
          sequential,
          sequentialEscrowAddress,
        ],
        account: accountForSimulate as Address
      });

      const hash = await walletClient.writeContract(request);
      console.log('[CeloSDK.createEscrow] Transaction sent:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('[CeloSDK.createEscrow] Transaction confirmed:', receipt);

      if (receipt.status !== 'success') {
        throw new Error(`CeloEscrowSDK: Create escrow transaction failed with status: ${receipt.status}`);
      }

      let escrowId: ChainAgnosticId | undefined;
      for (const log of receipt.logs as Log<bigint, number, false, undefined, true, Abi, string>[]) {
        try {
          const decodedEvent = viemDecodeEventLog<Abi, string>({
            abi: this.escrowContractABI, 
            data: log.data,
            topics: log.topics,
          });

          if (decodedEvent.eventName === 'EscrowCreated') {
            const eventArgs = decodedEvent.args as unknown as EscrowCreatedEventArgs; 
            if (eventArgs && typeof eventArgs.escrowId !== 'undefined') {
              escrowId = eventArgs.escrowId.toString();
              console.log(`[CeloSDK.createEscrow] Parsed EscrowCreated event, escrowId: ${escrowId}`);
              break; 
            }
          }
        } catch (e: unknown) {
          console.warn('[CeloSDK.createEscrow] Error decoding log for EscrowCreated event:', e);
        }
      }

      if (!escrowId) {
        console.error('[CeloSDK.createEscrow] Could not find EscrowCreated event or parse escrowId from logs:', receipt.logs);
        throw new Error('CeloEscrowSDK: Could not determine escrowId from transaction receipt.');
      }

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
        escrowId: escrowId,
      };
    } catch (error: unknown) {
      console.error('[CeloSDK.createEscrow] Error:', error);
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errorMessage = (error as { shortMessage?: string; message?: string }).shortMessage || (error as { message?: string }).message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`CeloEscrowSDK: Failed to create escrow: ${errorMessage}`);
    }
  }

  async getTokenAllowance(params: TokenAllowanceParams): Promise<ChainAgnosticAmount> {
    const publicClient = await this.getPublicClient(params.wallet);
    const owner = params.ownerAddress || params.wallet.address;

    if (!owner) {
      throw new Error('CeloEscrowSDK: Owner address is required to get token allowance.');
    }

    try {
      const allowanceBigInt = await publicClient.readContract({
        address: params.tokenAddress as Address,
        abi: viemErc20Abi, 
        functionName: 'allowance',
        args: [owner as Address, params.spenderAddress as Address],
      });

      // Assuming the token uses the configured USDC decimals. 
      // This might need adjustment for tokens with different decimals.
      return this.fromSmallestUnit(allowanceBigInt.toString(), this.config.usdcDecimals!);
    } catch (error: unknown) {
      console.error('[CeloSDK.getTokenAllowance] Error:', error);
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errorMessage = (error as { shortMessage?: string; message?: string }).shortMessage || (error as { message?: string }).message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`CeloEscrowSDK: Failed to get token allowance: ${errorMessage}`);
    }
  }

  async approveTokenSpending(params: ApproveTokenSpendingParams): Promise<TransactionResult> {
    const walletClient = await this.getWalletClient(params.wallet);
    const publicClient = await this.getPublicClient(params.wallet);

    const amountInSmallestUnit = this.toSmallestUnit(
      params.amount,
      this.config.usdcDecimals! // Assuming USDC decimals for now
    );

    try {
      const { request } = await publicClient.simulateContract({
        address: params.tokenAddress as Address,
        abi: viemErc20Abi, 
        functionName: 'approve',
        args: [params.spenderAddress as Address, BigInt(amountInSmallestUnit)],
        account: walletClient.account!,
      });

      const hash = await walletClient.writeContract(request);
      console.log('[CeloSDK.approveTokenSpending] Transaction sent:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('[CeloSDK.approveTokenSpending] Transaction confirmed:', receipt);

      if (receipt.status !== 'success') {
        throw new Error(`CeloEscrowSDK: Approve token spending transaction failed with status: ${receipt.status}`);
      }

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: unknown) {
      console.error('[CeloSDK.approveTokenSpending] Error:', error);
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errorMessage = (error as { shortMessage?: string; message?: string }).shortMessage || (error as { message?: string }).message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`CeloEscrowSDK: Failed to approve token spending: ${errorMessage}`);
    }
  }

  async fundEscrow(params: FundEscrowParams): Promise<TransactionResult> {
    const walletClient = await this.getWalletClient(params.wallet);
    const publicClient = await this.getPublicClient(params.wallet);

    if (!walletClient.account) {
      throw new Error('CeloEscrowSDK: Wallet client account is unexpectedly undefined in fundEscrow.');
    }
    const accountForSimulate: Address = typeof walletClient.account === 'string' 
      ? walletClient.account 
      : walletClient.account.address;

    try {
      console.log(`[CeloSDK.fundEscrow] Funding escrow: ${params.escrowId}`);

      const { request } = await publicClient.simulateContract({
        address: this.config.escrowContractAddress,
        abi: this.escrowContractABI,
        functionName: 'fundEscrow',
        args: [BigInt(params.escrowId.toString())],
        account: accountForSimulate
      });

      const hash = await walletClient.writeContract(request);
      console.log('[CeloSDK.fundEscrow] Transaction sent:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('[CeloSDK.fundEscrow] Transaction confirmed:', receipt);

      if (receipt.status !== 'success') {
        throw new Error(`CeloEscrowSDK: Fund escrow transaction failed with status: ${receipt.status}`);
      }

      // Optionally, parse logs for 'FundsDeposited' event if needed in the future.

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: unknown) {
      console.error(`[CeloSDK.fundEscrow] Error funding escrow ${params.escrowId}:`, error);
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errorMessage = (error as { shortMessage?: string; message?: string }).shortMessage || (error as { message?: string }).message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`CeloEscrowSDK: Failed to fund escrow: ${errorMessage}`);
    }
  }

  async markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult> {
    const walletClient = await this.getWalletClient(params.wallet);
    const publicClient = await this.getPublicClient(params.wallet);

    if (!walletClient.account) {
      throw new Error('CeloEscrowSDK: Wallet client account is unexpectedly undefined in markFiatPaid.');
    }
    const accountForSimulate: Address = typeof walletClient.account === 'string' 
      ? walletClient.account 
      : walletClient.account.address;

    try {
      console.log(`[CeloSDK.markFiatPaid] Marking fiat paid for escrow: ${params.escrowId}`);

      const { request } = await publicClient.simulateContract({
        address: this.config.escrowContractAddress,
        abi: this.escrowContractABI,
        functionName: 'markFiatPaid',
        args: [BigInt(params.escrowId.toString())],
        account: accountForSimulate,
      });

      const hash = await walletClient.writeContract(request);
      console.log('[CeloSDK.markFiatPaid] Transaction sent:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('[CeloSDK.markFiatPaid] Transaction confirmed:', receipt);

      if (receipt.status !== 'success') {
        throw new Error(`CeloEscrowSDK: Mark fiat paid transaction failed with status: ${receipt.status}`);
      }

      // Optionally, parse logs for 'FiatMarkedPaid' event if needed in the future.

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: unknown) {
      console.error(`[CeloSDK.markFiatPaid] Error marking fiat paid for escrow ${params.escrowId}:`, error);
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errorMessage = (error as { shortMessage?: string; message?: string }).shortMessage || (error as { message?: string }).message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`CeloEscrowSDK: Failed to mark fiat paid: ${errorMessage}`);
    }
  }

  async releaseEscrow(params: ReleaseEscrowParams): Promise<TransactionResult> {
    const walletClient: WalletClient = await this.getWalletClient(params.wallet);
    const publicClient: PublicClient = await this.getPublicClient(params.wallet);

    if (!walletClient.account) {
      throw new Error('CeloEscrowSDK: Wallet client account is unexpectedly undefined in releaseEscrow.');
    }
    const accountForSimulate: Address = typeof walletClient.account === 'string' 
      ? walletClient.account 
      : walletClient.account.address;

    try {
      console.log(`[CeloSDK.releaseEscrow] Releasing escrow: ${params.escrowId}`);

      const { request } = await publicClient.simulateContract({
        address: this.config.escrowContractAddress,
        abi: this.escrowContractABI,
        functionName: 'releaseEscrow',
        args: [BigInt(params.escrowId.toString())],
        account: accountForSimulate,
      });

      const hash = await walletClient.writeContract(request);
      console.log('[CeloSDK.releaseEscrow] Transaction sent:', hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('[CeloSDK.releaseEscrow] Transaction confirmed:', receipt);

      if (receipt.status !== 'success') {
        throw new Error(`CeloEscrowSDK: Release escrow transaction failed with status: ${receipt.status}`);
      }

      // Find and log the EscrowReleased event
      let escrowReleasedEventFound = false;
      for (const log of receipt.logs as Log<bigint, number, false, undefined, true, Abi, string>[]) {
        try {
          const decodedLog = viemDecodeEventLog({
            abi: this.escrowContractABI,
            data: log.data,
            topics: log.topics,
          });
          if (decodedLog.eventName === 'EscrowReleased') {
            console.log('[CeloSDK.releaseEscrow] EscrowReleased event found:', decodedLog.args);
            escrowReleasedEventFound = true;
            // Depending on the interface, you might want to extract and return args.escrowId etc.
            break; 
          }
        } catch (e: unknown) {
          let errorMsg = "Unknown error during event decoding";
          if (e instanceof Error) {
            errorMsg = e.message;
          } else if (typeof e === 'string') {
            errorMsg = e;
          } else if (e && typeof e === 'object' && 'message' in e) {
            // Check if 'message' is a string property for safety
            const potentialErrorWithMessage = e as { message?: unknown };
            if (typeof potentialErrorWithMessage.message === 'string') {
              errorMsg = potentialErrorWithMessage.message;
            } else if (e && typeof e === 'object') {
               errorMsg = JSON.stringify(e);
            } // else it remains 'Unknown error...'
          } else if (e && typeof e === 'object') {
             errorMsg = JSON.stringify(e);
          }
          console.warn(`[CeloSDK.releaseEscrow] Error decoding log for EscrowReleased event: ${errorMsg}`, e);
        }
      }
      if (!escrowReleasedEventFound) {
        console.warn('[CeloSDK.releaseEscrow] EscrowReleased event not found in transaction logs.');
        // This might not be a critical error, but good to be aware of.
      }

      return {
        transactionHash: hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: unknown) {
      console.error(`[CeloSDK.releaseEscrow] Error releasing escrow ${params.escrowId}:`, error);
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object' && error !== null) {
        errorMessage = (error as { shortMessage?: string; message?: string }).shortMessage || (error as { message?: string }).message || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      throw new Error(`CeloEscrowSDK: Failed to release escrow: ${errorMessage}`);
    }
  }

  async disputeEscrow(params: DisputeEscrowParams): Promise<TransactionResult> {
    console.warn('disputeEscrow not implemented in CeloEscrowSDK', params);
    throw new Error('Method not implemented.');
  }

  async cancelEscrow(params: CancelEscrowParams): Promise<TransactionResult> {
    console.warn('cancelEscrow not implemented in CeloEscrowSDK', params);
    throw new Error('Method not implemented.');
  }

  async getEscrowDetails(escrowId: ChainAgnosticId, wallet?: GenericWallet): Promise<EscrowDetails | null> {
    console.warn('getEscrowDetails not implemented in CeloEscrowSDK', escrowId, wallet);
    throw new Error('Method not implemented.');
  }

  async getTokenBalance(
    address: ChainAgnosticAddress,
    tokenAddress: ChainAgnosticAddress,
    wallet?: GenericWallet
  ): Promise<ChainAgnosticAmount> {
    console.warn('getTokenBalance not implemented in CeloEscrowSDK', address, tokenAddress, wallet);
    throw new Error('Method not implemented.');
  }

  toSmallestUnit(amount: string, decimals: number): ChainAgnosticAmount {
    return parseUnits(amount, decimals).toString();
  }

  fromSmallestUnit(amount: ChainAgnosticAmount, decimals: number): string {
    return formatUnits(BigInt(amount), decimals);
  }
}
