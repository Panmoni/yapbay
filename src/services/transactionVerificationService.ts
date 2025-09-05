import { toast } from 'sonner';
import { recordTransaction } from '../api';
import {
  getPendingTransactions,
  updatePendingTransaction,
  removePendingTransaction,
  PendingTransaction,
} from '../utils/pendingTransactions';
import { blockchainService } from './blockchainService.js';
import { Connection } from '@solana/web3.js';

let verificationInterval: ReturnType<typeof setInterval> | null = null;

// Helper function to check Solana transaction status
async function checkSolanaTransactionStatus(
  txHash: string
): Promise<{ confirmed: boolean; slot?: number }> {
  try {
    const network = blockchainService.getCurrentNetwork();
    const connection = new Connection(network.rpcUrl, 'confirmed');

    const signature = txHash;
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
    });

    if (transaction) {
      return {
        confirmed: true,
        slot: transaction.slot,
      };
    } else {
      return {
        confirmed: false,
      };
    }
  } catch (error) {
    console.error(`[TransactionVerification] Error checking Solana transaction ${txHash}:`, error);
    return {
      confirmed: false,
    };
  }
}

// Export for UI components to access
export const getPendingTransactionsForTrade = (tradeId: number): PendingTransaction[] => {
  return getPendingTransactions().filter(tx => tx.tradeId === tradeId);
};

// Start the verification service
export function startVerificationService(): void {
  if (verificationInterval) return;

  verificationInterval = setInterval(checkPendingTransactions, 15000); // Check every 15 seconds
  console.log('[TransactionVerification] Solana service started');
}

// Stop the verification service
export function stopVerificationService(): void {
  if (verificationInterval) {
    clearInterval(verificationInterval);
    verificationInterval = null;
    console.log('[TransactionVerification] Solana service stopped');
  }
}

// Check all pending transactions
async function checkPendingTransactions(): Promise<void> {
  const pendingTransactions = getPendingTransactions();

  if (pendingTransactions.length === 0) {
    stopVerificationService();
    return;
  }

  console.log(
    `[TransactionVerification] Checking ${pendingTransactions.length} pending Solana transactions`
  );

  for (const tx of pendingTransactions) {
    // Skip if checked recently (to avoid rate limiting)
    if (Date.now() - tx.lastChecked < 30000) continue; // 30 seconds

    // Update attempt count
    updatePendingTransaction(tx.txHash, {
      attempts: tx.attempts + 1,
      lastChecked: Date.now(),
    });

    try {
      console.log(
        `[TransactionVerification] Checking Solana transaction ${tx.txHash} (attempt ${
          tx.attempts + 1
        })`
      );

      // For Solana, we'll use a simple confirmation check
      // Since getTransactionStatus doesn't exist, we'll implement a basic check
      const transactionStatus = await checkSolanaTransactionStatus(tx.txHash);

      if (transactionStatus.confirmed) {
        console.log(
          `[TransactionVerification] Solana transaction ${tx.txHash} confirmed in slot ${transactionStatus.slot}`
        );

        // Transaction confirmed!
        await processConfirmedTransaction(
          {
            ...transactionStatus,
            txHash: tx.txHash,
            slot: transactionStatus.slot || 0,
          },
          tx
        );
        removePendingTransaction(tx.txHash);

        toast.success('Transaction confirmed!', {
          description: `Your ${tx.type
            .replace(/_/g, ' ')
            .toLowerCase()} has been processed successfully.`,
        });

        // Notify UI to refresh
        window.dispatchEvent(
          new CustomEvent('yapbay:refresh-trade', {
            detail: { tradeId: tx.tradeId },
          })
        );
      } else if (tx.attempts > 20) {
        // After ~10 minutes (20 attempts × 30 seconds), mark as potentially failed
        console.log(
          `[TransactionVerification] Solana transaction ${tx.txHash} verification timed out after ${tx.attempts} attempts`
        );

        // We don't remove it automatically - let the user decide to retry or dismiss
        toast.error('Transaction verification timed out', {
          description: 'Please check your wallet or Solana explorer for status.',
        });
      }
    } catch (error) {
      console.warn('[TransactionVerification] Error verifying Solana transaction:', error);
      // Keep trying
    }
  }
}

// Process a confirmed transaction
async function processConfirmedTransaction(
  transactionStatus: { txHash: string; slot: number; confirmed: boolean },
  tx: PendingTransaction
): Promise<void> {
  try {
    // Record the transaction in our backend
    await recordTransaction({
      trade_id: tx.tradeId,
      transaction_hash: transactionStatus.txHash,
      transaction_type: tx.type,
      status: 'SUCCESS',
      block_number: transactionStatus.slot, // Use slot number for Solana
      // Add required from_address property
      from_address: '0x0000000000000000000000000000000000000000', // Not applicable for Solana
      // Add empty metadata to satisfy type requirements
      metadata: {
        verified_by: 'solana_transaction_verification_service',
        slot: transactionStatus.slot?.toString() || '0',
      },
    });

    console.log(
      `[TransactionVerification] Recorded Solana transaction ${tx.txHash} for trade ${tx.tradeId}`
    );
  } catch (error) {
    console.error(
      '[TransactionVerification] Failed to record confirmed Solana transaction:',
      error
    );
  }
}

// Initialize the service when the module is loaded
export function initTransactionVerification(): void {
  // Start checking if there are any pending transactions
  const pendingTransactions = getPendingTransactions();
  if (pendingTransactions.length > 0) {
    console.log(
      `[TransactionVerification] Found ${pendingTransactions.length} pending Solana transactions on init`
    );
    startVerificationService();
  }

  // Listen for new transactions
  window.addEventListener('yapbay:new-transaction', () => {
    console.log('[TransactionVerification] New Solana transaction detected, starting service');
    startVerificationService();
  });
}

// Manually retry verification for a transaction
export function retryTransactionVerification(txHash: string): void {
  const transactions = getPendingTransactions();
  const tx = transactions.find(t => t.txHash === txHash);

  if (tx) {
    updatePendingTransaction(txHash, {
      lastChecked: 0, // Force immediate check
      attempts: 0, // Reset attempts
    });

    toast.info('Retrying Solana transaction verification...', {
      description: 'We will check the blockchain again for your transaction.',
    });

    startVerificationService();
  }
}

// Call this from your app initialization
initTransactionVerification();
