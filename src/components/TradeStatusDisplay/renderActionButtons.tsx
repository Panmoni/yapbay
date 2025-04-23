import React from "react";
import { TradeAction } from "../TradeActionButton";
import TradeActionButton from "../TradeActionButton";

interface RenderActionButtonsProps {
  availableActions: TradeAction[];
  loading: boolean;
  localLoading: TradeAction | null;
  handleAction: (action: TradeAction, handler?: () => Promise<void> | void) => void;
  onCreateEscrow?: () => void;
  onFundEscrow?: () => void;
  onMarkFiatPaid?: () => void;
  onReleaseCrypto?: () => void;
  onDisputeTrade?: () => void;
  onCancelTrade?: () => void;
}

/**
 * Renders action buttons based on available actions
 */
export const renderActionButtons = ({
  availableActions,
  loading,
  localLoading,
  handleAction,
  onCreateEscrow,
  onFundEscrow,
  onMarkFiatPaid,
  onReleaseCrypto,
  onDisputeTrade,
  onCancelTrade
}: RenderActionButtonsProps) => {
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