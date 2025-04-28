export interface PendingTransaction {
  txHash: string;
  tradeId: number;
  type: 'CREATE_ESCROW' | 'FUND_ESCROW' | 'MARK_FIAT_PAID' | 'RELEASE_ESCROW';
  timestamp: number;
  lastChecked: number;
  attempts: number;
}

// Get pending transactions from localStorage
export function getPendingTransactions(): PendingTransaction[] {
  try {
    const stored = localStorage.getItem('yapbay_pending_transactions');
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error retrieving pending transactions:', error);
    return [];
  }
}

// Add a new pending transaction
export function addPendingTransaction(transaction: Omit<PendingTransaction, 'lastChecked' | 'attempts'>): void {
  try {
    const transactions = getPendingTransactions();
    transactions.push({
      ...transaction,
      lastChecked: Date.now(),
      attempts: 0
    });
    localStorage.setItem('yapbay_pending_transactions', JSON.stringify(transactions));
    
    // Dispatch event to notify listeners
    window.dispatchEvent(new CustomEvent('yapbay:new-transaction'));
  } catch (error) {
    console.error('Error adding pending transaction:', error);
  }
}

// Remove a pending transaction
export function removePendingTransaction(txHash: string): void {
  try {
    const transactions = getPendingTransactions().filter(tx => tx.txHash !== txHash);
    localStorage.setItem('yapbay_pending_transactions', JSON.stringify(transactions));
  } catch (error) {
    console.error('Error removing pending transaction:', error);
  }
}

// Update a pending transaction
export function updatePendingTransaction(txHash: string, updates: Partial<PendingTransaction>): void {
  try {
    const transactions = getPendingTransactions();
    const index = transactions.findIndex(tx => tx.txHash === txHash);
    if (index >= 0) {
      transactions[index] = { ...transactions[index], ...updates };
      localStorage.setItem('yapbay_pending_transactions', JSON.stringify(transactions));
    }
  } catch (error) {
    console.error('Error updating pending transaction:', error);
  }
}
