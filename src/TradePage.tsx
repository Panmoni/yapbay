import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import ChatSection from '@/components/Trade/ChatSection';
import ParticipantsSection from '@/components/Trade/ParticipantsSection';
import TradeDetailsCard from '@/components/Trade/TradeDetailsCard';
import { useTradeParticipants } from './hooks/useTradeParticipants';
import { useTradeUpdates } from './hooks/useTradeUpdates';
import { useEscrowDetails } from './hooks/useEscrowDetails';
import { useTradeDetails } from './hooks/useTradeDetails';
import { useTradeActions } from './hooks/useTradeActions';
import { TradeHeader } from './components/Trade/TradeHeader';
import { TradeStatusCard } from './components/Trade/TradeStatusCard';
import { TradeNavigation } from './components/Trade/TradeNavigation';
import { LoadingIndicator } from './components/Trade/LoadingIndicator';
import { TradeNotFoundAlert } from './components/Trade/TradeNotFoundAlert';
import { refreshTrade } from './services/tradeService';
import { getPendingTransactionsForTrade, retryTransactionVerification } from './services/transactionVerificationService';
import { toast } from 'sonner';

function TradePage() {
  const { id } = useParams<{ id: string }>();
  const { primaryWallet } = useDynamicContext();
  const tradeId = id ? parseInt(id) : 0;

  // Custom hooks
  const { trade, offer, creator, buyerAccount, sellerAccount, loading, setTrade } =
    useTradeDetails(tradeId);

  const { userRole, currentAccount, counterparty } = useTradeParticipants(trade);

  // Use enhanced trade updates hook with smart polling
  const { 
    trade: tradeUpdates, 
    forcePoll: forceTradeUpdate,
    currentInterval: pollInterval
  } = useTradeUpdates(tradeId);

  const {
    escrowDetails,
    loading: escrowLoading,
    error: escrowError,
    balance,
    refresh: refreshEscrow,
  } = useEscrowDetails(trade?.leg1_escrow_onchain_id ?? null);

  // Function to refresh trade data
  const handleRefreshTrade = useCallback(() => {
    if (!tradeId) return;
    
    // Use the forcePoll function instead of calling the API directly
    forceTradeUpdate();
    
    // Keep the original refresh for backward compatibility
    refreshTrade(tradeId, setTrade).catch(error => {
      console.error('Error refreshing trade:', error);
    });
  }, [tradeId, setTrade, forceTradeUpdate]);

  const { createEscrow, markFiatPaid, releaseCrypto, disputeTrade, cancelTrade, actionLoading } =
    useTradeActions({
      trade,
      primaryWallet: primaryWallet || { address: undefined },
      counterparty,
      userRole,
      onRefresh: handleRefreshTrade,
    });

  const [pendingTxs, setPendingTxs] = useState<any[]>([]);

  // Reference to track previous polling interval value
  const prevIntervalRef = useRef<number | null>(null);
  
  // Use ref to store pending transactions to avoid re-renders
  const pendingTxsRef = useRef<any[]>([]);
  
  // Create a stable reference to the loadPendingTransactions function
  const loadPendingTransactions = useCallback(() => {
    if (!tradeId) return;
    const pending = getPendingTransactionsForTrade(tradeId);
    
    // Only update state if the pending transactions have actually changed
    if (JSON.stringify(pending) !== JSON.stringify(pendingTxsRef.current)) {
      pendingTxsRef.current = pending;
      setPendingTxs(pending);
    }
  }, [tradeId]);

  // Load pending transactions on component mount
  useEffect(() => {
    // Initial load
    loadPendingTransactions();
    
    // Refresh pending transactions every 15 seconds
    const interval = setInterval(loadPendingTransactions, 15000);
    
    // Listen for trade refresh events
    const handleRefreshEvent = (e: CustomEvent) => {
      if (e.detail?.tradeId === tradeId) {
        handleRefreshTrade();
      }
    };
    
    // Listen for trade state change events
    const handleTradeStateChange = (e: CustomEvent) => {
      if (e.detail?.tradeId === tradeId) {
        console.log(`[TradePage] Trade state changed to: ${e.detail.newState}`);
        // Force refresh pending transactions immediately on state change
        loadPendingTransactions();
      }
    };
    
    // Listen for new transaction events
    const handleNewTransaction = () => {
      loadPendingTransactions();
    };
    
    window.addEventListener('yapbay:refresh-trade', handleRefreshEvent as EventListener);
    window.addEventListener('yapbay:trade-state-changed', handleTradeStateChange as EventListener);
    window.addEventListener('yapbay:new-transaction', handleNewTransaction as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('yapbay:refresh-trade', handleRefreshEvent as EventListener);
      window.removeEventListener('yapbay:trade-state-changed', handleTradeStateChange as EventListener);
      window.removeEventListener('yapbay:new-transaction', handleNewTransaction as EventListener);
    };
  }, [tradeId, handleRefreshTrade, loadPendingTransactions]);

  // Log polling interval changes for debugging - only when it actually changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 
        prevIntervalRef.current !== pollInterval) {
      // Only log when the interval actually changes
      console.log(`[TradePage] Polling interval changed: ${pollInterval}ms`);
      prevIntervalRef.current = pollInterval;
    }
  }, [pollInterval]);

  // Handle retrying transaction verification
  const handleRetryVerification = (txHash: string) => {
    retryTransactionVerification(txHash);
    toast.info('Retrying transaction verification...', {
      description: 'We will check the blockchain again for your transaction.',
    });
  };

  // Render pending transactions UI
  const renderPendingTransactions = () => {
    if (pendingTxs.length === 0) return null;
    
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800">Pending Transactions</h3>
        <div className="mt-2">
          {pendingTxs.map((tx) => (
            <div key={tx.txHash} className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                <div className="animate-spin mr-2">⟳</div>
                <div>
                  <p className="text-sm text-yellow-700">
                    {tx.type.replace(/_/g, ' ').toLowerCase()} - Transaction {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                  </p>
                  <p className="text-xs text-yellow-600">
                    Submitted {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {tx.attempts > 10 && (
                <button 
                  onClick={() => handleRetryVerification(tx.txHash)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-yellow-700">
          Your transaction has been submitted to the blockchain and is being processed.
          You can continue using the app while we wait for confirmation.
        </p>
      </div>
    );
  };

  // Update trade data when we receive updates via polling
  useEffect(() => {
    if (tradeUpdates) {
      console.log(`[TradePage] Received trade update for trade ${tradeId}:`, tradeUpdates);
      setTrade(tradeUpdates);
    }
  }, [tradeUpdates, setTrade, tradeId]);

  // Add a debug log to track trade state changes
  useEffect(() => {
    if (trade) {
      console.log(`[TradePage] Current trade state for trade ${tradeId}:`, {
        id: trade.id,
        state: trade.leg1_state,
        created_at: trade.created_at
      });
    }
  }, [trade, tradeId]);

  // Reset trade state when trade ID changes
  useEffect(() => {
    setTrade(null);
  }, [tradeId, setTrade]);

  // Listen for critical state changes (like fiat paid) that require immediate refresh
  useEffect(() => {
    const handleCriticalStateChange = () => {
      console.log('[TradePage] Critical state change detected, refreshing trade data');
      if (tradeId) {
        // Force refresh trade data
        handleRefreshTrade();
        // Also reload pending transactions
        loadPendingTransactions();
      }
    };

    // Add event listener for critical state changes
    window.addEventListener('yapbay:critical-state-change', handleCriticalStateChange);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('yapbay:critical-state-change', handleCriticalStateChange);
    };
  }, [tradeId, handleRefreshTrade, loadPendingTransactions]);

  if (loading) {
    return <LoadingIndicator message="Loading trade details..." />;
  }

  if (!trade) {
    return <TradeNotFoundAlert />;
  }

  return (
    <div className="space-y-4">
      <TradeHeader userRole={userRole} />

      {trade && offer && (
        <TradeDetailsCard
          trade={trade}
          offer={offer}
          userRole={userRole}
          counterparty={counterparty}
        />
      )}

      <TradeStatusCard
        trade={trade}
        userRole={userRole}
        actions={{
          createEscrow,
          markFiatPaid,
          releaseCrypto,
          disputeTrade,
          cancelTrade,
        }}
        actionLoading={actionLoading}
        escrowDetails={
          escrowDetails
            ? {
                escrow_id: escrowDetails.escrow_id,
                amount: escrowDetails.amount,
                state: BigInt(escrowDetails.state),
              }
            : undefined
        }
        escrowLoading={escrowLoading}
        escrowError={escrowError}
        balance={balance}
        refreshEscrow={refreshEscrow}
      />

      {renderPendingTransactions()}

      <ChatSection counterparty={counterparty} />

      <ParticipantsSection
        buyerAccount={buyerAccount}
        sellerAccount={sellerAccount}
        currentAccount={currentAccount}
        creator={creator}
        trade={trade}
        userRole={userRole}
      />

      <TradeNavigation />
    </div>
  );
}

export default TradePage;
