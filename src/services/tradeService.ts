import {
  createTrade,
  Offer,
  Trade,
  recordEscrow,
  markFiatPaid,
  releaseEscrow,
  disputeEscrow,
  cancelEscrow,
  getTradeById,
  recordTransaction,
} from '../api';
import { formatNumber } from '../lib/utils';
import { handleApiError } from '../utils/errorHandling';
import { toast } from 'sonner';
import { createEscrowTransaction, markFiatPaidTransaction, checkAndFundEscrow } from './chainService';
import { config } from '../config';

interface StartTradeParams {
  offerId: number;
  amount?: string;
  fiatAmount?: number;
  offer: Offer;
  primaryWallet: { address?: string } | null;
  onSuccess: (tradeId: number) => void;
  onError: (error: Error) => void;
}

interface TransactionResult {
  txHash: string;
  blockNumber?: number;
  escrowId?: string;
  escrowAddress?: string;
}

interface EscrowResponseWithTx {
  txHash: string;
  blockNumber?: number;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Initiates a new trade based on an offer
 */
export const startTrade = async ({
  offerId,
  amount = '1000000',
  fiatAmount = 0,
  offer,
  primaryWallet,
  onSuccess,
  onError,
}: StartTradeParams): Promise<void> => {
  try {
    if (!offer) {
      throw new Error('Offer not found');
    }

    const tradeData = {
      leg1_offer_id: offerId,
      leg1_crypto_amount: amount,
      leg1_fiat_amount: fiatAmount.toString(),
      from_fiat_currency: offer.fiat_currency,
      destination_fiat_currency: offer.fiat_currency,
    };

    const tradeResponse = await createTrade(tradeData);
    const tradeId = tradeResponse.data.id;

    if (primaryWallet) {
      // MVP: Escrow creation moved to TradePage to happen manually by user action
      // const seller = primaryWallet.address;
      // const buyer = String(offer.creator_account_id);
      //
      // const escrowData = {
      //   trade_id: tradeId,
      //   escrow_id: Math.floor(Math.random() * 1000000),
      //   seller,
      //   buyer,
      //   amount: parseFloat(amount),
      // };
      //
      // const escrowResponse = await createEscrow(escrowData);
      // console.log("[TradeService] Escrow instruction generated:", escrowResponse.data);

      onSuccess(tradeId);
    } else {
      alert(`Trade ${formatNumber(tradeId)} started, but no wallet connected`);
      onError(new Error('No wallet connected'));
    }
  } catch (err) {
    console.error('[TradeService] Trade failed:', err);
    onError(err instanceof Error ? err : new Error('Unknown error'));
  }
};

/**
 * Parameters for creating an escrow
 */
interface CreateEscrowParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
    getWalletClient: () => Promise<unknown>;
    getPublicClient: () => Promise<unknown>;
  };
  buyerAddress: string;
  sellerAddress: string;
}

/**
 * Creates an escrow for a trade on the blockchain and records it in the backend
 */
export const createTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  try {
    // Show notification message using toast
    toast('Creating escrow on blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Create the escrow transaction on the blockchain
    const txResult = await createEscrowTransaction(primaryWallet, {
      tradeId: trade.id,
      buyer: buyerAddress,
      amount: parseFloat(trade.leg1_crypto_amount || '0'),
      sequential: false,
      sequentialEscrowAddress: undefined,
      arbitrator: config.arbitratorAddress || '0x0000000000000000000000000000000000000000',
    });

    console.log('[DEBUG] Transaction result:', txResult);

    // Record the transaction in our transaction system
    await recordTransaction({
      trade_id: trade.id,
      transaction_hash: txResult.txHash,
      transaction_type: 'CREATE_ESCROW',
      from_address: sellerAddress,
      to_address: buyerAddress,
      amount: trade.leg1_crypto_amount,
      token_type: trade.leg1_crypto_token,
      status: 'SUCCESS',
      block_number: Number(txResult.blockNumber),
      metadata: {
        escrow_id: txResult.escrowId,
        arbitrator: config.arbitratorAddress
      }
    });

    // Now notify the backend about the successful transaction (legacy system)
    const recordData = {
      trade_id: trade.id,
      transaction_hash: txResult.txHash,
      escrow_id: txResult.escrowId,
      seller: sellerAddress,
      buyer: buyerAddress,
      amount: parseFloat(trade.leg1_crypto_amount || '0'),
      sequential: false,
      arbitrator: config.arbitratorAddress || '0x0000000000000000000000000000000000000000',
    };

    await recordEscrow(recordData);

    toast.success('Escrow created successfully!');

    return txResult;
  } catch (err) {
    console.error('Error creating escrow:', err);
    const errorMessage = handleApiError(err, 'Failed to create escrow: Unknown error');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Creates an escrow for a trade and immediately prompts to fund it
 * This combines the escrow creation and funding steps into one flow
 */
export const createAndFundTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  let escrowResult;
  let fundResult;
  
  try {
    // First create the escrow
    escrowResult = await createTradeEscrow({
      trade,
      primaryWallet,
      buyerAddress,
      sellerAddress,
    });

    // Then check and fund it - note: only pass 2 arguments if that's what the function expects
    fundResult = await checkAndFundEscrow(
      primaryWallet,
      escrowResult.escrowId
    );

    // Convert result to expected format
    const txResult: TransactionResult = typeof fundResult === 'string' 
      ? { txHash: fundResult } 
      : fundResult as TransactionResult;

    // Record the funding transaction
    if (txResult && 'txHash' in txResult) {
      try {
        await recordTransaction({
          trade_id: trade.id,
          escrow_id: parseInt(escrowResult.escrowId),
          transaction_hash: txResult.txHash,
          transaction_type: 'FUND_ESCROW',
          from_address: sellerAddress,
          to_address: '',
          amount: trade.leg1_crypto_amount,
          token_type: trade.leg1_crypto_token,
          status: 'SUCCESS',
          block_number: txResult.blockNumber ? Number(txResult.blockNumber) : undefined,
          metadata: {
            escrow_id: escrowResult.escrowId
          }
        });
      } catch (recordError) {
        // Log the error but don't fail the entire transaction
        console.error('Failed to record transaction, but escrow was funded successfully:', recordError);
        
        // Store transaction in localStorage as fallback
        storeTransactionLocally({
          trade_id: trade.id,
          escrow_id: parseInt(escrowResult.escrowId),
          transaction_hash: txResult.txHash,
          transaction_type: 'FUND_ESCROW',
          from_address: sellerAddress,
          amount: trade.leg1_crypto_amount,
          token_type: trade.leg1_crypto_token,
          block_number: txResult.blockNumber ? Number(txResult.blockNumber) : undefined,
          timestamp: new Date().toISOString()
        });
        
        // Show a warning to the user
        toast.warning('Transaction completed on blockchain but could not be recorded in our database. This will be synced later.');
      }
    }

    return { escrow: escrowResult, fund: txResult };
  } catch (err) {
    console.error('Error in create and fund escrow flow:', err);
    
    // If we have partial results, store them for recovery
    if (escrowResult && !fundResult) {
      storeIncompleteEscrowLocally({
        trade_id: trade.id,
        escrow_id: escrowResult.escrowId,
        status: 'CREATED_NOT_FUNDED',
        timestamp: new Date().toISOString()
      });
    }
    
    const errorMessage = handleApiError(err, 'Failed to create and fund escrow');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Helper function to store transaction data locally when API fails
 * This serves as a fallback mechanism for transaction recording
 */
const storeTransactionLocally = (transactionData: {
  trade_id: number;
  escrow_id?: number;
  transaction_hash: string;
  transaction_type: string;
  from_address: string;
  to_address?: string;
  amount?: string;
  token_type?: string;
  block_number?: number;
  timestamp: string;
}) => {
  try {
    // Get existing pending transactions or initialize empty array
    const pendingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    
    // Add new transaction to the array
    pendingTransactions.push({
      ...transactionData,
      pendingSince: new Date().toISOString(),
      retryCount: 0
    });
    
    // Store updated array back to localStorage
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
    
    console.log('Transaction stored locally for future sync:', transactionData.transaction_hash);
    
    // Schedule a retry attempt
    setTimeout(() => retryPendingTransactions(), 30000); // Try again in 30 seconds
  } catch (error) {
    console.error('Failed to store transaction locally:', error);
  }
};

/**
 * Helper function to store incomplete escrow data locally
 * This helps with recovery of partially completed escrow operations
 */
const storeIncompleteEscrowLocally = (escrowData: {
  trade_id: number;
  escrow_id: string;
  status: string;
  timestamp: string;
}) => {
  try {
    // Get existing incomplete escrows or initialize empty array
    const incompleteEscrows = JSON.parse(localStorage.getItem('incompleteEscrows') || '[]');
    
    // Add new escrow to the array
    incompleteEscrows.push({
      ...escrowData,
      createdAt: new Date().toISOString(),
      retryCount: 0
    });
    
    // Store updated array back to localStorage
    localStorage.setItem('incompleteEscrows', JSON.stringify(incompleteEscrows));
    
    console.log('Incomplete escrow stored locally for future recovery:', escrowData.escrow_id);
  } catch (error) {
    console.error('Failed to store incomplete escrow locally:', error);
  }
};

/**
 * Retry sending pending transactions to the API
 * This function attempts to sync locally stored transactions with the backend
 */
const retryPendingTransactions = async () => {
  try {
    // Get pending transactions from localStorage
    const pendingTransactionsStr = localStorage.getItem('pendingTransactions');
    if (!pendingTransactionsStr) return;
    
    const pendingTransactions = JSON.parse(pendingTransactionsStr);
    if (!pendingTransactions.length) return;
    
    console.log(`Attempting to sync ${pendingTransactions.length} pending transactions`);
    
    // Keep track of successful transactions to remove them from localStorage
    const successfulTransactions: number[] = [];
    
    // Process each pending transaction
    for (let i = 0; i < pendingTransactions.length; i++) {
      const transaction = pendingTransactions[i];
      
      // Skip transactions that have been retried too many times (e.g., 5 times)
      if (transaction.retryCount >= 5) {
        console.log(`Skipping transaction ${transaction.transaction_hash} - too many retry attempts`);
        continue;
      }
      
      try {
        // Attempt to record the transaction
        await recordTransaction({
          trade_id: transaction.trade_id,
          escrow_id: transaction.escrow_id,
          transaction_hash: transaction.transaction_hash,
          transaction_type: transaction.transaction_type,
          from_address: transaction.from_address,
          to_address: transaction.to_address || '',
          amount: transaction.amount,
          token_type: transaction.token_type,
          status: 'SUCCESS',
          block_number: transaction.block_number,
          metadata: transaction.metadata || {}
        });
        
        // If successful, mark for removal
        successfulTransactions.push(i);
        console.log(`Successfully synced transaction ${transaction.transaction_hash}`);
      } catch (error) {
        // Increment retry count
        pendingTransactions[i].retryCount = (pendingTransactions[i].retryCount || 0) + 1;
        console.error(`Failed to sync transaction ${transaction.transaction_hash}, retry count: ${pendingTransactions[i].retryCount}`, error);
      }
    }
    
    // Remove successful transactions (in reverse order to avoid index issues)
    for (let i = successfulTransactions.length - 1; i >= 0; i--) {
      pendingTransactions.splice(successfulTransactions[i], 1);
    }
    
    // Update localStorage with remaining transactions
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
    
    // If there are still pending transactions, schedule another retry
    if (pendingTransactions.length > 0) {
      // Exponential backoff: wait longer between retries (1 minute)
      setTimeout(() => retryPendingTransactions(), 60000);
    }
  } catch (error) {
    console.error('Error in retryPendingTransactions:', error);
    // Schedule another retry despite the error
    setTimeout(() => retryPendingTransactions(), 60000);
  }
};

// Initialize retry mechanism on page load
setTimeout(() => {
  retryPendingTransactions();
}, 5000); // Wait 5 seconds after page load before first retry attempt

/**
 * Parameters for marking fiat as paid
 */
interface MarkFiatPaidParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
    getWalletClient: () => Promise<unknown>;
    getPublicClient: () => Promise<unknown>;
  };
}

/**
 * Marks fiat as paid for a trade on the blockchain and in the backend
 */
export const markTradeFiatPaid = async ({ trade, primaryWallet }: MarkFiatPaidParams) => {
  try {
    if (!trade.leg1_escrow_onchain_id) {
      throw new Error('No escrow ID found for this trade');
    }

    // Show notification message using toast
    toast('Marking fiat as paid on blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Call blockchain service to mark fiat as paid
    const result = await markFiatPaidTransaction(primaryWallet, trade.leg1_escrow_onchain_id);
    
    // Convert result to expected format
    const txResult: TransactionResult = typeof result === 'string' 
      ? { txHash: result } 
      : result as TransactionResult;

    // Record the transaction
    if (txResult && 'txHash' in txResult) {
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: parseInt(trade.leg1_escrow_onchain_id),
        transaction_hash: txResult.txHash,
        transaction_type: 'MARK_FIAT_PAID',
        from_address: primaryWallet.address || '',
        status: 'SUCCESS',
        block_number: Number(txResult.blockNumber),
        metadata: {
          escrow_id: trade.leg1_escrow_onchain_id
        }
      });
    }

    // Call API to update backend state
    await markFiatPaid(trade.id);

    toast.success('Fiat payment marked as paid successfully!');

    return txResult;
  } catch (err) {
    console.error('Error marking fiat as paid:', err);
    const errorMessage = handleApiError(err, 'Failed to mark fiat as paid');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for releasing crypto
 */
interface ReleaseCryptoParams {
  trade: Trade;
  primaryWallet: { address?: string };
}

/**
 * Releases crypto for a trade
 */
export const releaseTradeCrypto = async ({
  trade,
  primaryWallet,
}: ReleaseCryptoParams): Promise<void> => {
  try {
    // Call API to release escrow
    const response = await releaseEscrow({
      escrow_id: trade.id,
      trade_id: trade.id,
      authority: primaryWallet.address || '',
      buyer_token_account: 'placeholder', // This would come from the wallet
      arbitrator_token_account: 'placeholder', // This would be a system account
    });

    // Record the transaction if we have a transaction hash
    if (response?.data && typeof response.data === 'object' && 'txHash' in response.data) {
      // Cast to unknown first, then to our type to avoid TypeScript errors
      const txData = response.data as unknown as EscrowResponseWithTx;
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: trade.id,
        transaction_hash: txData.txHash,
        transaction_type: 'RELEASE_ESCROW',
        from_address: primaryWallet.address || '',
        to_address: trade.leg1_buyer_account_id?.toString() || '',
        amount: trade.leg1_crypto_amount,
        token_type: trade.leg1_crypto_token,
        status: 'SUCCESS',
        block_number: Number(txData.blockNumber),
      });
    }

    toast.success('Crypto released successfully!');
  } catch (err) {
    console.error('Error releasing crypto:', err);
    const errorMessage = handleApiError(err, 'Failed to release crypto');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for disputing a trade
 */
interface DisputeTradeParams {
  trade: Trade;
  primaryWallet: { address?: string };
}

/**
 * Disputes a trade
 */
export const disputeTrade = async ({ trade, primaryWallet }: DisputeTradeParams): Promise<void> => {
  try {
    // Call API to dispute escrow
    const response = await disputeEscrow({
      escrow_id: trade.id,
      trade_id: trade.id,
      disputing_party: primaryWallet.address || '',
      disputing_party_token_account: 'placeholder', // This would come from the wallet
    });

    // Record the transaction if we have a transaction hash
    if (response?.data && typeof response.data === 'object' && 'txHash' in response.data) {
      // Cast to unknown first, then to our type to avoid TypeScript errors
      const txData = response.data as unknown as EscrowResponseWithTx;
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: trade.id,
        transaction_hash: txData.txHash,
        transaction_type: 'DISPUTE_ESCROW',
        from_address: primaryWallet.address || '',
        status: 'SUCCESS',
        block_number: Number(txData.blockNumber),
        metadata: {
          disputing_party: primaryWallet.address || ''
        }
      });
    }

    toast.success('Trade disputed successfully');
  } catch (err) {
    console.error('Error disputing trade:', err);
    const errorMessage = handleApiError(err, 'Failed to dispute trade');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for cancelling a trade
 */
interface CancelTradeParams {
  trade: Trade;
  primaryWallet: { address?: string };
  userRole: string;
  counterpartyAddress?: string;
}

/**
 * Cancels a trade
 */
export const cancelTrade = async ({
  trade,
  primaryWallet,
  userRole,
  counterpartyAddress,
}: CancelTradeParams): Promise<void> => {
  try {
    // Call API to cancel escrow
    const response = await cancelEscrow({
      escrow_id: trade.id,
      trade_id: trade.id,
      seller: userRole === 'seller' ? primaryWallet.address || '' : counterpartyAddress || '',
      authority: primaryWallet.address || '',
    });

    // Record the transaction if we have a transaction hash
    if (response?.data && typeof response.data === 'object' && 'txHash' in response.data) {
      // Cast to unknown first, then to our type to avoid TypeScript errors
      const txData = response.data as unknown as EscrowResponseWithTx;
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: trade.id,
        transaction_hash: txData.txHash,
        transaction_type: 'CANCEL_ESCROW',
        from_address: primaryWallet.address || '',
        to_address: userRole === 'seller' ? (primaryWallet.address || '') : (counterpartyAddress || ''),
        status: 'SUCCESS',
        block_number: Number(txData.blockNumber),
        metadata: {
          cancelled_by: userRole,
          authority: primaryWallet.address || ''
        }
      });
    }

    toast.success('Trade cancelled successfully');
  } catch (err) {
    console.error('Error cancelling trade:', err);
    const errorMessage = handleApiError(err, 'Failed to cancel trade');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Refreshes trade data
 */
export const refreshTrade = async (
  tradeId: number,
  setTrade: (trade: Trade) => void
): Promise<void> => {
  try {
    const updatedTrade = await getTradeById(tradeId.toString());
    setTrade(updatedTrade.data);
  } catch (err) {
    console.error('Error refreshing trade:', err);
    const errorMessage = handleApiError(err, 'Failed to refresh trade data');
    toast.error(errorMessage);
  }
};
