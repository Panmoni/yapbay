import { useEffect } from 'react';
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
import TransactionHistory from './components/TransactionHistory';

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

  const handleRefreshTrade = () => {
    refreshTrade(tradeId, setTrade);
  };

  const { createEscrow, markFiatPaid, releaseCrypto, disputeTrade, cancelTrade, actionLoading } =
    useTradeActions({
      trade,
      primaryWallet: primaryWallet || { address: undefined },
      counterparty,
      userRole,
      onRefresh: handleRefreshTrade,
    });

  // Update trade data when we receive updates via polling
  useEffect(() => {
    if (tradeUpdates) {
      setTrade(tradeUpdates);
    }
  }, [tradeUpdates, setTrade]);

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

      {/* Transaction History Section */}
      <TransactionHistory tradeId={tradeId} className="mt-4" />

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
