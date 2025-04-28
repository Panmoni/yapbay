import { ethers } from 'ethers';
import { toast } from 'sonner';
import { recordTransaction } from '../api';
import { 
  getPendingTransactions, 
  updatePendingTransaction, 
  removePendingTransaction,
  PendingTransaction
} from '../utils/pendingTransactions';

let verificationInterval: ReturnType<typeof setInterval> | null = null;

// Export for UI components to access
export const getPendingTransactionsForTrade = (tradeId: number): PendingTransaction[] => {
  return getPendingTransactions().filter(tx => tx.tradeId === tradeId);
};

// Start the verification service
export function startVerificationService(): void {
  if (verificationInterval) return;
  
  verificationInterval = setInterval(checkPendingTransactions, 15000); // Check every 15 seconds
  console.log('[TransactionVerification] Service started');
}

// Stop the verification service
export function stopVerificationService(): void {
  if (verificationInterval) {
    clearInterval(verificationInterval);
    verificationInterval = null;
    console.log('[TransactionVerification] Service stopped');
  }
}

// Check all pending transactions
async function checkPendingTransactions(): Promise<void> {
  const pendingTransactions = getPendingTransactions();
  
  if (pendingTransactions.length === 0) {
    stopVerificationService();
    return;
  }
  
  console.log(`[TransactionVerification] Checking ${pendingTransactions.length} pending transactions`);
  
  const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_CELO_RPC_URL);
  
  for (const tx of pendingTransactions) {
    // Skip if checked recently (to avoid rate limiting)
    if (Date.now() - tx.lastChecked < 30000) continue; // 30 seconds
    
    // Update attempt count
    updatePendingTransaction(tx.txHash, { 
      attempts: tx.attempts + 1,
      lastChecked: Date.now()
    });
    
    try {
      console.log(`[TransactionVerification] Checking transaction ${tx.txHash} (attempt ${tx.attempts + 1})`);
      const receipt = await provider.getTransactionReceipt(tx.txHash);
      
      if (receipt) {
        console.log(`[TransactionVerification] Transaction ${tx.txHash} confirmed in block ${receipt.blockNumber}`);
        
        // Transaction confirmed!
        await processConfirmedTransaction(receipt, tx);
        removePendingTransaction(tx.txHash);
        
        toast.success('Transaction confirmed!', {
          description: `Your ${tx.type.replace(/_/g, ' ').toLowerCase()} has been processed successfully.`,
        });
        
        // Notify UI to refresh
        window.dispatchEvent(new CustomEvent('yapbay:refresh-trade', { 
          detail: { tradeId: tx.tradeId } 
        }));
      } else if (tx.attempts > 20) {
        // After ~10 minutes (20 attempts × 30 seconds), mark as potentially failed
        console.log(`[TransactionVerification] Transaction ${tx.txHash} verification timed out after ${tx.attempts} attempts`);
        
        // We don't remove it automatically - let the user decide to retry or dismiss
        toast.error('Transaction verification timed out', {
          description: 'Please check your wallet or blockchain explorer for status.',
        });
      }
    } catch (error) {
      console.warn('[TransactionVerification] Error verifying transaction:', error);
      // Keep trying
    }
  }
}

// Process a confirmed transaction
async function processConfirmedTransaction(
  receipt: ethers.TransactionReceipt, 
  tx: PendingTransaction
): Promise<void> {
  try {
    // Record the transaction in our backend
    await recordTransaction({
      trade_id: tx.tradeId,
      transaction_hash: receipt.hash,
      transaction_type: tx.type,
      status: 'SUCCESS',
      block_number: Number(receipt.blockNumber),
      // Add required from_address property
      from_address: receipt.from || '0x0000000000000000000000000000000000000000',
      // Add empty metadata to satisfy type requirements
      metadata: {
        verified_by: 'transaction_verification_service'
      }
    });
    
    console.log(`[TransactionVerification] Recorded transaction ${receipt.hash} for trade ${tx.tradeId}`);
  } catch (error) {
    console.error('[TransactionVerification] Failed to record confirmed transaction:', error);
  }
}

// Initialize the service when the module is loaded
export function initTransactionVerification(): void {
  // Start checking if there are any pending transactions
  const pendingTransactions = getPendingTransactions();
  if (pendingTransactions.length > 0) {
    console.log(`[TransactionVerification] Found ${pendingTransactions.length} pending transactions on init`);
    startVerificationService();
  }
  
  // Listen for new transactions
  window.addEventListener('yapbay:new-transaction', () => {
    console.log('[TransactionVerification] New transaction detected, starting service');
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
      attempts: 0     // Reset attempts
    });
    
    toast.info('Retrying transaction verification...', {
      description: 'We will check the blockchain again for your transaction.',
    });
    
    startVerificationService();
  }
}

// Call this from your app initialization
initTransactionVerification();
