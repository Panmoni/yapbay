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
import {
  getPendingTransactionsForTrade,
  retryTransactionVerification,
} from './services/transactionVerificationService';
import { toast } from 'sonner';
import {
  AUTH_STATE_CHANGE_EVENT,
  TRADE_REFRESH_EVENT,
  TRADE_STATE_CHANGE_EVENT,
  NEW_TRANSACTION_EVENT,
  CRITICAL_STATE_CHANGE_EVENT,
} from './utils/events';

// Helper function to convert escrow state string to numeric value
const escrowStateToNumber = (state: string | number): number => {
  if (typeof state === 'number') return state;

  switch (state) {
    case 'CREATED':
      return 0;
    case 'FUNDED':
      return 1;
    case 'RELEASED':
      return 2;
    case 'CANCELLED':
      return 3;
    case 'DISPUTED':
      return 4;
    case 'RESOLVED':
      return 5;
    default:
      return 0;
  }
};

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
    forceRefresh: forceTradeRefresh,
  } = useTradeUpdates(tradeId);

  const {
    escrowDetails,
    loading: escrowLoading,
    error: escrowError,
    balance,
    refresh: refreshEscrow,
  } = useEscrowDetails(trade?.leg1_escrow_address ?? null);

  // Function to refresh trade data
  const handleRefreshTrade = useCallback(() => {
    if (!tradeId) return;

    // Use the forceRefresh function to clear cache and force fresh fetch
    forceTradeRefresh();

    // Keep the original refresh for backward compatibility
    refreshTrade(tradeId, setTrade).catch(error => {
      console.error('Error refreshing trade:', error);
    });
  }, [tradeId, setTrade, forceTradeRefresh]);

  const { createEscrow, markFiatPaid, releaseCrypto, disputeTrade, cancelTrade, actionLoading } =
    useTradeActions({
      trade,
      primaryWallet: primaryWallet || { address: undefined },
      counterparty,
      userRole,
      onRefresh: handleRefreshTrade,
    });

  const [pendingTxs, setPendingTxs] = useState<any[]>([]);

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
        handleRefreshTrade();
      }
    };

    // Listen for new transaction events
    const handleNewTransaction = () => {
      loadPendingTransactions();
    };

    // Add event listeners
    window.addEventListener(TRADE_REFRESH_EVENT, handleRefreshEvent as EventListener);
    window.addEventListener(TRADE_STATE_CHANGE_EVENT, handleTradeStateChange as EventListener);
    window.addEventListener(NEW_TRANSACTION_EVENT, handleNewTransaction);

    // Listen for auth state change events (wallet connection/disconnection)
    const handleAuthStateChange = (e: CustomEvent) => {
      console.log('[TradePage] Auth state changed:', e.detail);
      // Refresh trade data when wallet is connected
      if (e.detail?.authenticated) {
        console.log('[TradePage] Wallet connected, refreshing trade data');
        handleRefreshTrade();
        refreshEscrow();
        loadPendingTransactions();

        // Show notification
        toast.success('Wallet connected. Trade data refreshed.');
      } else {
        // Handle wallet disconnection
        console.log('[TradePage] Wallet disconnected, redirecting to home page');
        // Redirect to home page
        window.location.href = '/';
        // Show notification
        toast.info('Wallet disconnected. Redirecting to home page.');
      }
    };

    // Add auth state change event listener
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange as EventListener);

    // Clean up event listeners on component unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener(TRADE_REFRESH_EVENT, handleRefreshEvent as EventListener);
      window.removeEventListener(TRADE_STATE_CHANGE_EVENT, handleTradeStateChange as EventListener);
      window.removeEventListener(NEW_TRANSACTION_EVENT, handleNewTransaction);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange as EventListener);
    };
  }, [tradeId, handleRefreshTrade, loadPendingTransactions, refreshEscrow]);

  // Handle retrying transaction verification
  const handleRetryVerification = (txHash: string) => {
    retryTransactionVerification(txHash);
    toast.info('Retrying transaction verification...');
  };

  // Render pending transactions UI
  const renderPendingTransactions = () => {
    if (pendingTxs.length === 0) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pending Transactions</h3>
        <div className="space-y-2">
          {pendingTxs.map(tx => (
            <div
              key={tx.txHash}
              className="flex items-center justify-between bg-yellow-100 p-2 rounded"
            >
              <div className="flex items-center">
                <div className="animate-spin mr-2">⟳</div>
                <div>
                  <p className="text-sm text-yellow-700">
                    {tx.type.replace(/_/g, ' ').toLowerCase()} - Transaction {tx.txHash.slice(0, 6)}
                    ...{tx.txHash.slice(-4)}
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
          Your transaction has been submitted to the blockchain and is being processed. You can
          continue using the app while we wait for confirmation.
        </p>
      </div>
    );
  };

  // Update trade data when we receive updates via polling
  useEffect(() => {
    if (tradeUpdates) {
      // Check if the data is actually different
      const isDataDifferent =
        !trade ||
        trade.id !== tradeUpdates.id ||
        trade.leg1_state !== tradeUpdates.leg1_state ||
        trade.updated_at !== tradeUpdates.updated_at;

      if (isDataDifferent) {
        console.log(
          `[TradePage] Trade state updated: ${trade?.leg1_state} → ${tradeUpdates.leg1_state}`
        );
        setTrade(tradeUpdates);
      }
    }
  }, [tradeUpdates, setTrade, tradeId, trade]);

  // Track trade state changes (reduced logging)
  useEffect(() => {
    if (trade && trade.id) {
      console.log(`[TradePage] Trade ${tradeId} state: ${trade.leg1_state}`);
    }
  }, [trade?.leg1_state, tradeId]);

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
    window.addEventListener(CRITICAL_STATE_CHANGE_EVENT, handleCriticalStateChange);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener(CRITICAL_STATE_CHANGE_EVENT, handleCriticalStateChange);
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
                escrow_id: BigInt(escrowDetails.escrowId),
                amount: BigInt(escrowDetails.amount.toString()),
                state: BigInt(escrowStateToNumber(escrowDetails.state)),
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
