import { useEffect, useState, useCallback } from 'react';
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

  const { trade: tradeUpdates } = useTradeUpdates(tradeId);

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
    
    refreshTrade(tradeId, setTrade).catch(error => {
      console.error('Error refreshing trade:', error);
    });
  }, [tradeId, setTrade]);

  const { createEscrow, markFiatPaid, releaseCrypto, disputeTrade, cancelTrade, actionLoading } =
    useTradeActions({
      trade,
      primaryWallet: primaryWallet || { address: undefined },
      counterparty,
      userRole,
      onRefresh: handleRefreshTrade,
    });

  const [pendingTxs, setPendingTxs] = useState<any[]>([]);

  // Load pending transactions on component mount
  useEffect(() => {
    const loadPendingTransactions = () => {
      if (!tradeId) return;
      const pending = getPendingTransactionsForTrade(tradeId);
      setPendingTxs(pending);
    };
    
    loadPendingTransactions();
    
    // Refresh pending transactions every 15 seconds
    const interval = setInterval(loadPendingTransactions, 15000);
    
    // Listen for trade refresh events
    const handleRefreshEvent = (e: CustomEvent) => {
      if (e.detail?.tradeId === tradeId) {
        handleRefreshTrade();
      }
    };
    
    window.addEventListener('yapbay:refresh-trade', handleRefreshEvent as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('yapbay:refresh-trade', handleRefreshEvent as EventListener);
    };
  }, [tradeId, handleRefreshTrade]);

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
