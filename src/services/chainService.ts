import { blockchainService } from './blockchainService.js';
import { BN } from '@coral-xyz/anchor';

/**
 * Creates an escrow transaction on the Solana blockchain
 * @param wallet The Dynamic.xyz wallet object
 * @param params Parameters for creating the escrow
 * @returns The transaction result with escrow ID, transaction hash, and block number
 */
export const createEscrowTransaction = async (
  wallet: any,
  params: {
    tradeId: number;
    escrowId: number; // Accept pre-generated escrow ID
    buyer: string;
    amount: number;
    sequential?: boolean;
    sequentialEscrowAddress?: string;
    arbitrator?: string; // Optional parameter for arbitrator address
  }
) => {
  try {
    console.log('[DEBUG] Creating Solana escrow with parameters:', {
      tradeId: params.tradeId,
      escrowId: params.escrowId,
      buyer: params.buyer,
      amount: params.amount,
      sequential: params.sequential || false,
      sequentialEscrowAddress: params.sequentialEscrowAddress,
    });

    // Convert amount to BN (assuming 6 decimals for USDC)
    const amountBN = new BN(params.amount * 1_000_000); // Convert to smallest unit

    // Create escrow using UnifiedBlockchainService
    const result = await blockchainService.createEscrow({
      escrowId: params.escrowId, // Use the pre-generated escrow ID
      tradeId: params.tradeId,
      sellerAddress: wallet.address,
      buyerAddress: params.buyer,
      amount: amountBN,
      arbitratorAddress: params.arbitrator || '', // Use provided arbitrator or empty
      depositDeadline: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days from now
      fiatDeadline: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days from now
      sequential: params.sequential || false,
      sequentialEscrowAddress: params.sequentialEscrowAddress,
    });

    console.log('[DEBUG] Solana escrow created:', result);

    return {
      escrowId: params.escrowId.toString(), // Return the same escrow ID that was passed in
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
      // Include the full result for debugging
      fullResult: result,
    };
  } catch (error) {
    console.error('[ERROR] Failed to create Solana escrow:', error);
    throw error;
  }
};

/**
 * Checks the token allowance granted by an owner to a spender.
 * Note: This is not applicable to Solana as it uses a different token model.
 * @param wallet The Dynamic.xyz wallet object
 * @param tokenAddress The address of the token mint
 * @param spenderAddress The address of the spender (not used in Solana)
 * @param ownerAddress The address of the token owner (optional, defaults to wallet address)
 * @returns The allowance amount as a BigInt (always returns max for Solana)
 */
export const getTokenAllowance = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _wallet: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tokenAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _spenderAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ownerAddress?: string
): Promise<bigint> => {
  // In Solana, token accounts don't have allowances like ERC20
  // The owner has full control over their token accounts
  console.log('[DEBUG] Solana token allowance check - returning max allowance');
  return BigInt('18446744073709551615'); // Max uint64
};

/**
 * Approves a spender to spend a certain amount of the owner's tokens.
 * Note: This is not applicable to Solana as it uses a different token model.
 * @param wallet The Dynamic.xyz wallet object
 * @param tokenAddress The address of the token mint
 * @param spenderAddress The address of the spender (not used in Solana)
 * @param amount The amount to approve (not used in Solana)
 * @returns The transaction hash (returns empty string for Solana)
 */
export const approveTokenSpending = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _wallet: any,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tokenAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _spenderAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _amount: bigint
): Promise<string> => {
  // In Solana, no approval is needed - the owner has full control
  console.log('[DEBUG] Solana token approval - no approval needed');
  return ''; // Return empty string to indicate no transaction needed
};

/**
 * Funds an existing escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund (as a string or number)
 * @returns The transaction result with txHash and blockNumber.
 */
export const fundEscrowTransaction = async (
  wallet: any,
  escrowId: string | number,
  tradeData?: { id: number; leg1_crypto_amount: number }
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {
    console.log(`[DEBUG] Funding Solana escrow with ID: ${escrowId}`);

    // Use trade data if available, otherwise fall back to defaults
    const tradeId = tradeData?.id || 0;
    const amount = tradeData?.leg1_crypto_amount
      ? (tradeData.leg1_crypto_amount * 1000000).toString() // Convert to USDC units (6 decimals)
      : '1000000'; // Default 1 USDC

    // For now, we'll use an empty seller token account and let the blockchain service handle it
    // In a real implementation, we'd derive the associated token account
    const result = await blockchainService.fundEscrow({
      escrowId: Number(escrowId),
      tradeId: tradeId,
      amount: amount,
      sellerAddress: wallet.address,
      sellerTokenAccount: '', // The blockchain service should derive this
    });

    console.log('[DEBUG] Solana escrow funded:', result);

    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to fund Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Helper function to check if an escrow needs funding and fund it if necessary.
 * This handles the token approval and funding in one function.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund
 * @param amount The amount to fund (in the smallest unit, e.g., wei)
 * @returns The transaction hash of the funding transaction.
 */
export const checkAndFundEscrow = async (
  wallet: any,
  escrowId: string | number,
  tradeData?: { id: number; leg1_crypto_amount: number }
): Promise<string> => {
  try {
    console.log(`[DEBUG] Checking and funding Solana escrow ${escrowId}`);

    // In Solana, we don't need to check allowance, just fund directly
    const result = await fundEscrowTransaction(wallet, escrowId, tradeData);
    return result.txHash;
  } catch (error) {
    console.error(`[ERROR] Failed to check and fund Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Marks the fiat payment as paid for an escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to mark as paid (as a string or number)
 * @returns The transaction hash.
 */
export const markFiatPaidTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<string> => {
  try {
    console.log(`[DEBUG] Marking fiat as paid for Solana escrow with ID: ${escrowId}`);

    const result = await blockchainService.markFiatPaid({
      escrowId: Number(escrowId),
      tradeId: 0, // We'll need to get this from the escrow data
      buyerAddress: wallet.address,
    });

    console.log('[DEBUG] Solana fiat marked as paid:', result);

    return result.transactionHash || result.signature || '';
  } catch (error) {
    console.error(`[ERROR] Failed to mark fiat as paid for Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Releases an escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to release
 * @returns The transaction hash and block number
 */
export const releaseEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {
    console.log(`[DEBUG] Releasing Solana escrow with ID: ${escrowId}`);

    const result = await blockchainService.releaseEscrow({
      escrowId: Number(escrowId),
      tradeId: 0, // We'll need to get this from the escrow data
      authorityAddress: wallet.address,
      buyerTokenAccount: '', // We'll need to derive this
      arbitratorTokenAccount: '', // We'll need to derive this
      sequentialEscrowTokenAccount: undefined,
    });

    console.log('[DEBUG] Solana escrow released:', result);

    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to release Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Opens a dispute for an escrow on the Solana blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to dispute
 * @param evidenceHash The hash of the evidence for the dispute (bytes32)
 * @returns The transaction hash and block number
 */
export const disputeEscrowTransaction = async (
  wallet: any,
  escrowId: string | number,
  evidenceHash: string
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {
    console.log(`[DEBUG] Opening dispute for Solana escrow with ID: ${escrowId}`);

    const result = await blockchainService.openDispute({
      escrowId: Number(escrowId),
      tradeId: 0, // We'll need to get this from the escrow data
      evidenceHash: evidenceHash,
      bondAmount: '1000000', // Default bond amount
      disputingPartyAddress: wallet.address,
      disputingPartyTokenAccount: '', // We'll need to derive this
    });

    console.log('[DEBUG] Solana dispute opened:', result);

    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to dispute Solana escrow ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Fetches the USDC balance for a given wallet address using Solana.
 * @param address Wallet address (string)
 * @param chainId Network chain ID (optional, defaults to devnet)
 * @returns Promise<BigInt> USDC balance (in smallest unit, e.g. 6 decimals)
 */
export async function getUsdcBalance(
  address: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _chainId?: number
): Promise<bigint> {
  try {
    console.log(`[DEBUG] Getting USDC balance for Solana address: ${address}`);

    // Use the blockchain service to get balance
    const balance = await blockchainService.getWalletBalance();

    console.log(`[DEBUG] Solana USDC balance: ${balance.toString()}`);
    return BigInt(balance);
  } catch (error) {
    console.error('[ERROR] Failed to get Solana USDC balance:', error);
    throw error;
  }
}

/**
 * Checks the state and funds of an escrow on Solana.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to check
 * @returns Object containing state and amount information
 */
export const checkEscrowState = async (
  _wallet: any,
  escrowId: string | number
): Promise<{ state: number; amount: bigint; hasFunds: boolean; fiatPaid: boolean }> => {
  try {
    console.log(`[DEBUG] Checking Solana escrow state for ID: ${escrowId}`);

    const escrowState = await blockchainService.getEscrowState(Number(escrowId), 0);
    const escrowBalance = await blockchainService.getEscrowBalance(Number(escrowId), 0);

    const state = Number(escrowState);
    const amount = BigInt(escrowBalance);
    const hasFunds = amount > BigInt(0);
    const fiatPaid = false; // We'll need to get this from escrow details

    console.log(
      `[DEBUG] Solana escrow ${escrowId} state: ${state}, amount: ${amount.toString()}, fiatPaid: ${fiatPaid}`
    );

    return { state, amount, hasFunds, fiatPaid };
  } catch (error) {
    console.error(`[ERROR] Failed to check Solana escrow state for ${escrowId}:`, error);
    throw error;
  }
};

/**
 * Cancels an escrow on the Solana blockchain.
 * First checks if the escrow has funds and prevents cancellation if it does.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to cancel
 * @returns The transaction hash and block number
 */
export const cancelEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<{ txHash: string; blockNumber: bigint }> => {
  try {
    // First check if the escrow has funds
    const { hasFunds } = await checkEscrowState(wallet, escrowId);
    if (hasFunds) {
      throw new Error(
        'Cannot cancel an escrow that still has funds. The funds must be released first.'
      );
    }

    console.log(`[DEBUG] Cancelling Solana escrow with ID: ${escrowId}`);

    const result = await blockchainService.cancelEscrow({
      escrowId: Number(escrowId),
      tradeId: 0, // We'll need to get this from the escrow data
      sellerAddress: wallet.address,
      authorityAddress: wallet.address,
      sellerTokenAccount: '', // We'll need to derive this
    });

    console.log('[DEBUG] Solana escrow cancelled:', result);

    return {
      txHash: result.transactionHash || result.signature || '',
      blockNumber: BigInt(result.slot || result.blockNumber || 0),
    };
  } catch (error) {
    console.error(`[ERROR] Failed to cancel Solana escrow ${escrowId}:`, error);
    throw error;
  }
};
