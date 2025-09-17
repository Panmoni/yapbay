import {
  createTrade,
  Offer,
  Trade,
  recordEscrow,
  markFiatPaid,
  getTradeById,
  recordTransaction,
} from '../api';
import { formatNumber } from '../lib/utils';
import { handleApiError } from '../utils/errorHandling';
import { toast } from 'sonner';
import {
  createEscrowTransaction,
  markFiatPaidTransaction,
  checkAndFundEscrow,
  releaseEscrowTransaction,
  disputeEscrowTransaction,
  cancelEscrowTransaction,
  checkEscrowState,
} from './chainService';
// Removed unused imports

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
      leg1_crypto_amount: parseFloat(amount), // Convert string to number as API expects
      leg1_fiat_amount: fiatAmount, // Already rounded to 2 decimal places
      from_fiat_currency: offer.fiat_currency,
      destination_fiat_currency: offer.fiat_currency,
    };

    const tradeResponse = await createTrade(tradeData);
    console.log('[TradeService] createTrade response:', tradeResponse);
    console.log('[TradeService] response.data:', tradeResponse.data);
    console.log('[TradeService] response.data.id:', tradeResponse.data.id);
    console.log('[TradeService] response.data.trade:', tradeResponse.data.trade);

    // Handle potential new API response structure with network wrapper
    const tradeId = tradeResponse.data.trade?.id || tradeResponse.data.id;
    console.log('[TradeService] extracted tradeId:', tradeId);

    if (primaryWallet) {
      // MVP: Escrow creation moved to TradePage to happen manually by user action
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
  };
  buyerAddress: string;
  sellerAddress: string;
}

/**
 * Creates an escrow for a trade on the Solana blockchain and records it in the backend
 */
export const createTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  try {
    // Show notification message using toast
    toast('Creating escrow on Solana blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Create the escrow transaction on the Solana blockchain
    const txResult = await createEscrowTransaction(primaryWallet, {
      tradeId: trade.id,
      buyer: buyerAddress,
      amount: parseFloat(trade.leg1_crypto_amount || '0'),
      sequential: false,
      sequentialEscrowAddress: undefined,
      arbitrator: undefined, // Solana program handles arbitrator internally
    });

    console.log('[DEBUG] Solana transaction result:', txResult);

    // Record the escrow in our backend
    await recordEscrow({
      trade_id: trade.id,
      transaction_hash: txResult.txHash,
      escrow_id: parseInt(txResult.escrowId),
      seller: sellerAddress,
      buyer: buyerAddress,
      amount: parseFloat(trade.leg1_crypto_amount || '0'),
      sequential: false,
      sequential_escrow_address: '0x0000000000000000000000000000000000000000', // Not applicable for Solana
    });

    // Add null checks and default values for all potentially undefined string values
    const leg1CryptoAmount = trade.leg1_crypto_amount || '0';
    const leg1CryptoToken = trade.leg1_crypto_token || 'USDC';

    // Record the transaction
    await recordTransaction({
      trade_id: trade.id,
      escrow_id: parseInt(txResult.escrowId),
      transaction_hash: txResult.txHash,
      transaction_type: 'CREATE_ESCROW',
      from_address: sellerAddress,
      to_address: buyerAddress,
      amount: leg1CryptoAmount,
      token_type: leg1CryptoToken,
      status: 'SUCCESS',
      block_number: Number(txResult.blockNumber),
      metadata: {
        escrow_id: txResult.escrowId,
        seller: sellerAddress,
        buyer: buyerAddress,
      },
    });

    // Show success message
    toast.success('Escrow created successfully!', {
      description: `Escrow ID: ${txResult.escrowId}`,
    });

    return {
      txHash: txResult.txHash,
      blockNumber: txResult.blockNumber,
      success: true,
      message: `Escrow created with ID: ${txResult.escrowId}`,
      escrowId: txResult.escrowId,
    };
  } catch (err) {
    console.error('Error creating Solana escrow:', err);
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

    // Verify we have a valid escrow ID before proceeding
    if (!escrowResult.escrowId || escrowResult.escrowId === '0') {
      throw new Error('Invalid escrow ID. Cannot proceed with funding.');
    }

    // Then check and fund it with the confirmed escrow ID
    fundResult = await checkAndFundEscrow(primaryWallet, escrowResult.escrowId);

    // Convert result to expected format
    const txResult: TransactionResult =
      typeof fundResult === 'string' ? { txHash: fundResult } : (fundResult as TransactionResult);

    // Record the funding transaction
    if (txResult && 'txHash' in txResult) {
      try {
        await recordTransaction({
          trade_id: trade.id,
          escrow_id: escrowResult.escrowId ? parseInt(escrowResult.escrowId) : 0,
          transaction_hash: String(txResult.txHash),
          transaction_type: 'FUND_ESCROW',
          from_address: sellerAddress,
          to_address: '', // Solana doesn't use contract addresses
          amount: trade.leg1_crypto_amount || '0',
          token_type: trade.leg1_crypto_token || 'USDC',
          status: 'SUCCESS',
          block_number: txResult.blockNumber ? Number(txResult.blockNumber) : undefined,
          metadata: {
            escrow_id: escrowResult.escrowId || '0',
            seller: sellerAddress,
            buyer: buyerAddress,
          },
        });
      } catch (recordError) {
        // Log the error but don't fail the entire transaction
        console.error(
          'Failed to record transaction, but escrow was funded successfully:',
          recordError
        );

        // Store transaction in localStorage as fallback
        storeTransactionLocally({
          trade_id: trade.id,
          escrow_id: escrowResult.escrowId ? parseInt(escrowResult.escrowId) : 0,
          transaction_hash: String(txResult.txHash),
          transaction_type: 'FUND_ESCROW',
          from_address: sellerAddress,
          to_address: '',
          amount: trade.leg1_crypto_amount || '0',
          token_type: trade.leg1_crypto_token || 'USDC',
          block_number: txResult.blockNumber ? Number(txResult.blockNumber) : undefined,
          timestamp: new Date().toISOString(),
        });

        // Show a warning to the user
        toast.warning(
          'Transaction completed on blockchain but could not be recorded in our database. This will be synced later.'
        );
      }
    }

    return { escrow: escrowResult, fund: txResult };
  } catch (err) {
    console.error('Error in create and fund escrow flow:', err);

    // If we have partial results, store them for recovery
    if (escrowResult && !fundResult) {
      storeIncompleteEscrowLocally({
        trade_id: trade.id,
        escrow_id: escrowResult.escrowId || '0',
        status: 'CREATED_NOT_FUNDED',
        timestamp: new Date().toISOString(),
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
      retryCount: 0,
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
      retryCount: 0,
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
        console.log(
          `Skipping transaction ${transaction.transaction_hash} - too many retry attempts`
        );
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
          metadata: transaction.metadata || {},
        });

        // If successful, mark for removal
        successfulTransactions.push(i);
        console.log(`Successfully synced transaction ${transaction.transaction_hash}`);
      } catch (error) {
        // Increment retry count
        pendingTransactions[i].retryCount = (pendingTransactions[i].retryCount || 0) + 1;
        console.error(
          `Failed to sync transaction ${transaction.transaction_hash}, retry count: ${pendingTransactions[i].retryCount}`,
          error
        );
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
 * Marks fiat as paid for a trade
 */
export const markTradeFiatPaid = async ({
  trade,
  primaryWallet,
}: {
  trade: Trade;
  primaryWallet: { address?: string };
}) => {
  try {
    if (!trade.leg1_escrow_onchain_id) {
      throw new Error('No escrow ID found for this trade');
    }

    // Check the current state of the escrow
    try {
      // Just check if the escrow exists, we don't need to use the state value
      await checkEscrowState(primaryWallet, trade.leg1_escrow_onchain_id);

      // Show notification message using toast
      toast('Marking fiat as paid...', {
        description: 'Please approve the transaction in your wallet.',
      });

      try {
        // Execute the blockchain transaction
        const result = await markFiatPaidTransaction(primaryWallet, trade.leg1_escrow_onchain_id);

        // Record the transaction details via the recordTransaction API
        await recordTransaction({
          trade_id: trade.id,
          escrow_id: Number(trade.leg1_escrow_onchain_id),
          transaction_hash: result,
          transaction_type: 'MARK_FIAT_PAID',
          from_address: primaryWallet.address || '',
          status: 'SUCCESS',
          metadata: {
            buyer: trade.leg1_buyer_account_id ? trade.leg1_buyer_account_id.toString() : '',
          },
        });

        // Call the backend API to update the trade status
        await markFiatPaid(trade.id);

        // Dispatch a global event to notify all open tabs/windows about this critical state change
        const event = new CustomEvent('yapbay:critical-state-change', {
          detail: {
            tradeId: trade.id,
            newState: 'FIAT_PAID',
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);

        // Force an immediate refresh for all clients by invalidating cache
        localStorage.setItem('yapbay_last_trade_update', new Date().toISOString());

        toast.success('Fiat payment marked as complete');
      } catch (error: unknown) {
        const err = error as Error;
        // Handle specific blockchain errors with user-friendly messages
        if (err.message.includes('User rejected the request')) {
          toast.error('Transaction cancelled', {
            description: 'You cancelled the transaction in your wallet.',
          });
        } else if (err.message.includes('reverted')) {
          toast.error('Transaction failed', {
            description:
              'The blockchain rejected this transaction. The escrow may be in an invalid state or you may not have permission to mark it as paid.',
          });
        } else {
          // Generic error handling
          toast.error('Failed to mark fiat as paid', {
            description: err.message || 'An unexpected error occurred',
          });
        }
        throw error;
      }
    } catch (error) {
      // This catch block handles errors from checkEscrowState
      if (error instanceof Error && error.message.includes('Escrow not found')) {
        toast.error('Escrow not found', {
          description: 'The escrow could not be found on the blockchain.',
        });
      }
      throw error;
    }
  } catch (err) {
    console.error('Error marking fiat as paid:', err);
    // Don't show another toast here since we've already shown specific ones above
    throw err;
  }
};

/**
 * Parameters for releasing crypto
 */
interface ReleaseCryptoParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
}

/**
 * Releases crypto for a trade
 */
export const releaseTradeCrypto = async ({
  trade,
  primaryWallet,
}: ReleaseCryptoParams): Promise<void> => {
  if (!trade || !primaryWallet?.address || !trade.leg1_escrow_onchain_id) return;

  try {
    toast('Releasing crypto on Solana blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Execute the blockchain transaction
    const txResult = await releaseEscrowTransaction(primaryWallet, trade.leg1_escrow_onchain_id);

    // Record the transaction details via the recordTransaction API
    await recordTransaction({
      trade_id: trade.id,
      escrow_id: Number(trade.leg1_escrow_onchain_id),
      transaction_hash: txResult.txHash,
      transaction_type: 'RELEASE_ESCROW',
      from_address: primaryWallet.address,
      to_address: trade.leg1_buyer_account_id ? trade.leg1_buyer_account_id.toString() : '',
      amount: trade.leg1_crypto_amount,
      token_type: trade.leg1_crypto_token,
      status: 'SUCCESS',
      block_number: Number(txResult.blockNumber),
    });

    toast.success('Crypto released successfully!');
  } catch (error: unknown) {
    console.error('Error releasing crypto:', error);

    // Extract a more user-friendly error message
    let errorMessage = 'Failed to release crypto. Please try again.';

    if (error instanceof Error && error.message) {
      if (error.message.includes('User rejected the request')) {
        errorMessage = 'Transaction was rejected in your wallet.';
      } else if (error.message.includes('reverted')) {
        // Extract the specific revert reason if available
        if (error.message.includes('Release escrow transaction reverted:')) {
          const revertReason = error.message
            .split('Release escrow transaction reverted:')[1]
            .trim();
          errorMessage = `Transaction failed: ${revertReason}`;
        } else {
          errorMessage =
            'Transaction failed on the blockchain. This could be due to contract restrictions or network issues.';
        }
      } else if (error.message.includes('no funds')) {
        errorMessage = 'This escrow has no funds to release.';
      }
    }

    toast.error(errorMessage);
    throw error;
  }
};

/**
 * Parameters for disputing a trade
 */
interface DisputeTradeParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
}

/**
 * Disputes a trade
 */
export const disputeTrade = async ({ trade, primaryWallet }: DisputeTradeParams): Promise<void> => {
  if (!trade || !primaryWallet?.address || !trade.leg1_escrow_onchain_id) return;

  try {
    toast('Opening dispute on Solana blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Generate a dummy evidence hash for now - in production this would be a real hash of evidence
    const evidenceHash = 'dispute_evidence_' + Date.now().toString();

    try {
      // Execute the blockchain transaction
      const txResult = await disputeEscrowTransaction(
        primaryWallet,
        trade.leg1_escrow_onchain_id,
        evidenceHash
      );

      // Record the transaction details via the recordTransaction API
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: Number(trade.leg1_escrow_onchain_id),
        transaction_hash: txResult.txHash,
        transaction_type: 'DISPUTE_ESCROW',
        from_address: primaryWallet.address,
        status: 'SUCCESS',
        block_number: Number(txResult.blockNumber),
        metadata: {
          disputing_party: primaryWallet.address,
          evidence_hash: evidenceHash,
        },
      });

      toast.success('Trade disputed successfully');
    } catch (error: unknown) {
      const err = error as Error;
      // Handle specific blockchain errors with user-friendly messages
      if (err.message.includes('User rejected the request')) {
        toast.error('Transaction cancelled', {
          description: 'You cancelled the transaction in your wallet.',
        });
      } else if (err.message.includes('reverted')) {
        toast.error('Transaction failed', {
          description:
            'The blockchain rejected this transaction. The escrow may be in an invalid state for disputes or you may not have permission.',
        });
      } else if (err.message.includes('insufficient funds')) {
        toast.error('Insufficient funds', {
          description:
            'You do not have enough funds to open a dispute. Disputes may require a bond payment.',
        });
      } else {
        // Generic error handling
        toast.error('Failed to open dispute', {
          description: err.message || 'An unexpected error occurred',
        });
      }
      throw error;
    }
  } catch (err) {
    console.error('Error disputing trade:', err);
    // Don't show another toast here since we've already shown specific ones above
    throw err;
  }
};

/**
 * Interface for cancel trade parameters
 */
interface CancelTradeParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
  };
}

/**
 * Cancels a trade
 */
export const cancelTrade = async ({ trade, primaryWallet }: CancelTradeParams): Promise<void> => {
  if (!trade || !primaryWallet?.address || !trade.leg1_escrow_onchain_id) return;

  try {
    toast('Checking escrow state...', {
      description: 'Verifying that the escrow has no funds before cancellation.',
    });

    try {
      const escrowState = await checkEscrowState(primaryWallet, trade.leg1_escrow_onchain_id);

      // If the escrow has funds, we cannot cancel it
      if (escrowState.hasFunds) {
        toast.error('Cannot cancel trade', {
          description:
            'The escrow still has funds. The funds must be released or refunded before cancellation.',
        });
        throw new Error('Escrow has funds. Cannot cancel.');
      }

      toast('Cancelling trade on Solana blockchain...', {
        description: 'Please approve the transaction in your wallet.',
      });

      try {
        // Execute the blockchain transaction
        const txResult = await cancelEscrowTransaction(primaryWallet, trade.leg1_escrow_onchain_id);

        // Record the transaction details via the recordTransaction API
        await recordTransaction({
          trade_id: trade.id,
          escrow_id: Number(trade.leg1_escrow_onchain_id),
          transaction_hash: String(txResult.txHash),
          transaction_type: 'CANCEL_ESCROW',
          from_address: primaryWallet.address,
          status: 'SUCCESS',
          block_number: Number(txResult.blockNumber),
          metadata: {
            seller: trade.leg1_seller_account_id ? trade.leg1_seller_account_id.toString() : '',
            authority: primaryWallet.address,
          },
        });

        toast.success('Trade cancelled successfully');
      } catch (error: unknown) {
        const err = error as Error;
        // Handle specific blockchain errors with user-friendly messages
        if (err.message.includes('User rejected the request')) {
          toast.error('Transaction cancelled', {
            description: 'You cancelled the transaction in your wallet.',
          });
        } else if (err.message.includes('reverted')) {
          toast.error('Transaction failed', {
            description:
              'The blockchain rejected this transaction. The escrow may be in an invalid state or you may not have permission to cancel it.',
          });
        } else if (err.message.includes('Escrow has funds')) {
          toast.error('Cannot cancel trade', {
            description:
              'The escrow still has funds. The funds must be released or refunded before cancellation.',
          });
        } else {
          // Generic error handling
          toast.error('Failed to cancel trade', {
            description: err.message || 'An unexpected error occurred',
          });
        }
        throw error;
      }
    } catch (error) {
      // This catch block handles errors from checkEscrowState
      if (error instanceof Error && error.message.includes('Escrow not found')) {
        toast.error('Escrow not found', {
          description: 'The escrow could not be found on the blockchain.',
        });
      }
      throw error;
    }
  } catch (err) {
    console.error('Error cancelling trade:', err);
    // Don't show another toast here since we've already shown specific ones above
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
    const updatedTrade = await getTradeById(tradeId);
    setTrade(updatedTrade.data);
  } catch (err) {
    console.error('Error refreshing trade:', err);
    const errorMessage = handleApiError(err, 'Failed to refresh trade data');
    toast.error(errorMessage);
  }
};
