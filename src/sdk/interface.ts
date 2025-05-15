import { Address, Hex, PublicClient, WalletClient } from 'viem';

export type ChainAgnosticAddress = string;
export type ChainAgnosticAmount = string; // Represent amounts as strings to handle large numbers and varying decimals
export type ChainAgnosticId = string | number;
export type TransactionHash = string;
export type BlockNumber = bigint | number;

/**
 * Generic wallet object type. Specific SDKs will know how to use this.
 * For Dynamic.xyz, this would typically be the wallet object they provide.
 */
export interface GenericWallet {
  address?: Address;
  // other properties like chain, connected, etc., can be added as needed
  signMessage?: (args: { message: string }) => Promise<Hex>;
  sendTransaction?: (transaction: any) => Promise<Hex>; // Type 'any' for now, can be more specific
  getPublicClient?: () => Promise<PublicClient>; // Use PublicClient from viem
  getWalletClient?: () => Promise<WalletClient>; // Use WalletClient from viem
}

export interface EscrowCreationParams {
  tradeId: ChainAgnosticId;
  buyerAddress: ChainAgnosticAddress;
  amount: ChainAgnosticAmount; 
  tokenAddress?: ChainAgnosticAddress; 
  sequential?: boolean;
  sequentialEscrowAddress?: ChainAgnosticAddress;
  arbitratorAddress?: ChainAgnosticAddress;
}

export interface EscrowDetails {
  id: ChainAgnosticId;
  tradeId: ChainAgnosticId;
  sellerAddress: ChainAgnosticAddress;
  buyerAddress: ChainAgnosticAddress;
  arbitratorAddress: ChainAgnosticAddress;
  amount: ChainAgnosticAmount;
  state: string; 
  isSequential: boolean;
  sequentialEscrowAddress?: ChainAgnosticAddress;
  hasFunds: boolean;
  isFiatPaid: boolean;
  depositDeadline?: number | string;
  fiatDeadline?: number | string;
  creationTimestamp?: number | string;
}

export interface TokenAllowanceParams {
  wallet: GenericWallet;
  tokenAddress: ChainAgnosticAddress;
  spenderAddress: ChainAgnosticAddress;
  ownerAddress?: ChainAgnosticAddress; 
}

export interface ApproveTokenSpendingParams extends TokenAllowanceParams {
  amount: ChainAgnosticAmount;
}

export interface FundEscrowParams {
  wallet: GenericWallet;
  escrowId: ChainAgnosticId;
}

export interface MarkFiatPaidParams {
  wallet: GenericWallet;
  escrowId: ChainAgnosticId;
}

export interface ReleaseEscrowParams {
  wallet: GenericWallet;
  escrowId: ChainAgnosticId;
}

export interface DisputeEscrowParams {
  wallet: GenericWallet;
  escrowId: ChainAgnosticId;
  evidenceHash: string; 
}

export interface CancelEscrowParams {
  wallet: GenericWallet;
  escrowId: ChainAgnosticId;
}

export interface TransactionResult {
  transactionHash: TransactionHash;
  blockNumber?: BlockNumber;
}

export interface CreateEscrowResult extends TransactionResult {
  escrowId: ChainAgnosticId;
}

export interface IEscrowPlatformSDK {
  createEscrow(wallet: GenericWallet, params: EscrowCreationParams): Promise<CreateEscrowResult>;
  getTokenAllowance(params: TokenAllowanceParams): Promise<ChainAgnosticAmount>;
  approveTokenSpending(params: ApproveTokenSpendingParams): Promise<TransactionResult>;
  fundEscrow(params: FundEscrowParams): Promise<TransactionResult>;
  markFiatPaid(params: MarkFiatPaidParams): Promise<TransactionResult>;
  releaseEscrow(params: ReleaseEscrowParams): Promise<TransactionResult>;
  disputeEscrow(params: DisputeEscrowParams): Promise<TransactionResult>;
  cancelEscrow(params: CancelEscrowParams): Promise<TransactionResult>;
  getEscrowDetails(escrowId: ChainAgnosticId, wallet?: GenericWallet): Promise<EscrowDetails | null>;
  getTokenBalance(
    address: ChainAgnosticAddress,
    tokenAddress: ChainAgnosticAddress,
    wallet?: GenericWallet
  ): Promise<ChainAgnosticAmount>;
  toSmallestUnit(amount: string, decimals: number): ChainAgnosticAmount;
  fromSmallestUnit(amount: ChainAgnosticAmount, decimals: number): string;
}
