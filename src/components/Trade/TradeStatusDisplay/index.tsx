import React, { useState } from 'react';
import { Trade } from '@/api';
import StatusBadge from '@/components/Shared/StatusBadge';
import TradeProgressBar from './TradeProgressBar';
import { TradeAction } from './TradeActionButton';
import { EscrowDetailsPanel } from './EscrowDetailsPanel';
import { EscrowState } from '@/hooks/useEscrowDetails';
import { tradeStateMessages } from '@/utils/tradeStates';

// Import utility functions and components
import { getAvailableActions } from '@/components/Trade/TradeStatusDisplay/getAvailableActions';
import { renderTimers } from '@/components/Trade/TradeStatusDisplay/renderTimers';
import { renderActionButtons } from '@/components/Trade/TradeStatusDisplay/renderActionButtons';
import { ExceptionalCases } from '@/components/Trade/TradeStatusDisplay/renderExceptionalCases';

interface TradeStatusDisplayProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onCreateEscrow?: () => void;
  onFundEscrow?: () => void;
  onMarkFiatPaid?: () => void;
  onReleaseCrypto?: () => void;
  onDisputeTrade?: () => void;
  onCancelTrade?: () => void;
  loading?: boolean;
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  escrowLoading?: boolean;
  escrowError?: Error | null;
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}

const TradeStatusDisplay: React.FC<TradeStatusDisplayProps> = ({
  trade,
  userRole,
  onCreateEscrow,
  onFundEscrow,
  onMarkFiatPaid,
  onReleaseCrypto,
  onDisputeTrade,
  onCancelTrade,
  loading = false,
  escrowDetails,
  balance,
  refreshEscrow,
}) => {
  const [localLoading, setLocalLoading] = useState<TradeAction | null>(null);
  const [lastLogTime, setLastLogTime] = useState<number>(0);

  // Get the appropriate message for the current state and role from the centralized tradeStateMessages
  const message = trade.leg1_state
    ? tradeStateMessages[trade.leg1_state]?.[userRole] || 'Unknown state'
    : 'Unknown state';

  // No longer need to calculate these here as they're handled in the utility functions

  // Helper function to handle action button clicks with loading state
  const handleAction = async (action: TradeAction, handler?: () => Promise<void> | void) => {
    if (!handler || loading) return; // Don't execute if already loading

    setLocalLoading(action);
    try {
      await handler();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setLocalLoading(null);
    }
  };

  // Get available actions using the imported utility function
  const availableActions = getAvailableActions({
    trade,
    userRole,
    lastLogTime,
    setLastLogTime,
  });

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center justify-between">
        <StatusBadge className="text-base py-1.5 px-3">{trade.leg1_state}</StatusBadge>
        <p className="text-lg font-medium">{message}</p>
      </div>

      <TradeProgressBar
        state={trade.leg1_state}
        isExceptional={
          trade.leg1_state === 'FUNDED' &&
          escrowDetails &&
          Number(escrowDetails.state) === EscrowState.CREATED &&
          parseFloat(balance || '0') < Number(escrowDetails.amount)
        }
      />

      {renderTimers({ trade, userRole })}
      {renderActionButtons({
        availableActions,
        loading,
        localLoading,
        handleAction,
        onCreateEscrow,
        onFundEscrow,
        onMarkFiatPaid,
        onReleaseCrypto,
        onDisputeTrade,
        onCancelTrade,
      })}

      {/* Handle exceptional cases */}
      <ExceptionalCases
        trade={trade}
        userRole={userRole}
        escrowDetails={escrowDetails}
        balance={balance}
        refreshEscrow={refreshEscrow}
      />

      {/* Add the escrow details panel if we have an on-chain escrow ID */}
      {trade.leg1_escrow_onchain_id && (
        <EscrowDetailsPanel
          escrowId={trade.leg1_escrow_onchain_id}
          trade={trade}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default TradeStatusDisplay;
