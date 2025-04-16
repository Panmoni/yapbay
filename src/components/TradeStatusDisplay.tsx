import React, { useState } from "react";
import { Trade } from "@/api";
import StatusBadge from "./StatusBadge";
import TradeProgressBar from "./TradeProgressBar";
import TradeTimer from "./TradeTimer";
import TradeActionButton, { TradeAction } from "./TradeActionButton";
import { isDeadlineExpired } from "@/hooks/useTradeUpdates";

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
}) => {
  const [localLoading, setLocalLoading] = useState<TradeAction | null>(null);

  // Map states to user-friendly messages based on role
  const stateMessages: Record<string, Record<string, string>> = {
    'CREATED': {
      buyer: "Waiting for seller to create and fund escrow",
      seller: "You need to create and fund the escrow"
    },
    'AWAITING_FIAT_PAYMENT': {
      buyer: "You need to make the fiat payment",
      seller: "Waiting for buyer to make fiat payment"
    },
    'PENDING_CRYPTO_RELEASE': {
      buyer: "Waiting for seller to release crypto",
      seller: "Buyer has marked payment as sent. You need to release crypto."
    },
    'DISPUTED': {
      buyer: "Trade is under dispute. Awaiting resolution.",
      seller: "Trade is under dispute. Awaiting resolution."
    },
    'COMPLETED': {
      buyer: "Trade completed successfully",
      seller: "Trade completed successfully"
    },
    'CANCELLED': {
      buyer: "Trade was cancelled",
      seller: "Trade was cancelled"
    }
  };

  // Get the appropriate message for the current state and role
  const message = stateMessages[trade.leg1_state]?.[userRole] || "Unknown state";

  // Determine if deadlines have expired
  const escrowDeadlineExpired = isDeadlineExpired(trade.leg1_escrow_deposit_deadline);
  const fiatPaymentDeadlineExpired = isDeadlineExpired(trade.leg1_fiat_payment_deadline);

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

  // Determine which actions are available based on state, role, and time conditions
  const getAvailableActions = (): TradeAction[] => {
    console.log('Evaluating available actions for:', {
      state: trade.leg1_state,
      userRole,
      escrowDeadlineExpired,
      fiatPaymentDeadlineExpired
    });

    switch (trade.leg1_state) {
      case 'CREATED':
        console.log('Trade is in CREATED state');
        if (userRole === 'seller') {
          console.log('User is seller, escrow deadline expired:', escrowDeadlineExpired);
          return escrowDeadlineExpired ? ['cancel'] : ['create_escrow'];
        }
        console.log('User is buyer, no actions available');
        return [];

      case 'AWAITING_FIAT_PAYMENT':
        if (userRole === 'buyer') {
          return ['mark_paid'];
        } else if (userRole === 'seller' && fiatPaymentDeadlineExpired) {
          return ['cancel'];
        }
        return [];

      case 'PENDING_CRYPTO_RELEASE':
        if (userRole === 'seller') {
          return ['release', 'dispute'];
        } else if (userRole === 'buyer') {
          return ['dispute'];
        }
        return [];

      case 'DISPUTED':
        return [];

      case 'COMPLETED':
      case 'CANCELLED':
        return [];

      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();

  // Render action buttons based on available actions
  const renderActionButtons = () => {
    if (availableActions.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {availableActions.includes('create_escrow') && (
          <TradeActionButton
            action="create_escrow"
            onClick={() => handleAction('create_escrow', onCreateEscrow)}
            loading={loading || localLoading === 'create_escrow'}
          />
        )}
        {availableActions.includes('fund_escrow') && (
          <TradeActionButton
            action="fund_escrow"
            onClick={() => handleAction('fund_escrow', onFundEscrow)}
            loading={loading || localLoading === 'fund_escrow'}
          />
        )}
        {availableActions.includes('mark_paid') && (
          <TradeActionButton
            action="mark_paid"
            onClick={() => handleAction('mark_paid', onMarkFiatPaid)}
            loading={loading || localLoading === 'mark_paid'}
          />
        )}
        {availableActions.includes('release') && (
          <TradeActionButton
            action="release"
            onClick={() => handleAction('release', onReleaseCrypto)}
            loading={loading || localLoading === 'release'}
          />
        )}
        {availableActions.includes('dispute') && (
          <TradeActionButton
            action="dispute"
            onClick={() => handleAction('dispute', onDisputeTrade)}
            loading={loading || localLoading === 'dispute'}
          />
        )}
        {availableActions.includes('cancel') && (
          <TradeActionButton
            action="cancel"
            onClick={() => handleAction('cancel', onCancelTrade)}
            loading={loading || localLoading === 'cancel'}
          />
        )}
      </div>
    );
  };

  // Render timers based on state and deadlines
  const renderTimers = () => {
    if (trade.leg1_state === 'CREATED' && trade.leg1_escrow_deposit_deadline) {
      return (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <TradeTimer
            deadline={trade.leg1_escrow_deposit_deadline}
            label={userRole === 'seller' ? "Time remaining to fund escrow:" : "Waiting for seller to fund escrow:"}
          />
        </div>
      );
    }

    if (trade.leg1_state === 'AWAITING_FIAT_PAYMENT' && trade.leg1_fiat_payment_deadline) {
      return (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <TradeTimer
            deadline={trade.leg1_fiat_payment_deadline}
            label={userRole === 'buyer' ? "Time remaining to make payment:" : "Waiting for buyer to make payment:"}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-md">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-purple-700 font-medium">Processing...</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <StatusBadge className="text-base py-1.5 px-3">{trade.leg1_state}</StatusBadge>
        <p className="text-lg font-medium">{message}</p>
      </div>

      <TradeProgressBar state={trade.leg1_state} />

      {renderTimers()}
      {renderActionButtons()}
    </div>
  );
};

export default TradeStatusDisplay;
