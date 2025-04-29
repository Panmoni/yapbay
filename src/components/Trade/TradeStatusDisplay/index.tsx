import React, { useState, useMemo } from 'react';
import { Trade } from '@/api';
import StatusBadge from '@/components/Shared/StatusBadge';
// import TradeProgressBar from './TradeProgressBar'; // Removed ProgressBar
import { TradeAction } from './TradeActionButton';
import { EscrowDetailsPanel } from './EscrowDetailsPanel';
// import { EscrowState } from '@/hooks/useEscrowDetails'; // Removed unused import
import { TradeLegState, tradeStateMessages } from '@/utils/tradeStates';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Added
import { Button } from '@/components/ui/button'; // Added
import {
  ChevronsUpDown, // Added
  Lock, // Added
  Send, // Added
  CheckCircle, // Added
  ShieldAlert, // Added
  XCircle, // Added
  Hourglass, // Added
  Check, // Added
} from 'lucide-react'; // Added
import { cn } from '@/lib/utils'; // Added
import TransactionHistory from './TransactionHistory'; // Added

// Import utility functions and components
import { getAvailableActions } from '@/components/Trade/TradeStatusDisplay/getAvailableActions';
import { renderTimers } from '@/components/Trade/TradeStatusDisplay/renderTimers';
import { renderActionButtons } from '@/components/Trade/TradeStatusDisplay/renderActionButtons';
import { ExceptionalCases } from '@/components/Trade/TradeStatusDisplay/renderExceptionalCases';

// --- Copied from TradeLegend ---
// Define the visual steps including exceptional states
const tradeVisualSteps: { state: TradeLegState; icon: React.ElementType }[] = [
  { state: TradeLegState.CREATED, icon: Lock },
  { state: TradeLegState.FUNDED, icon: Check },
  { state: TradeLegState.AWAITING_FIAT_PAYMENT, icon: Hourglass },
  { state: TradeLegState.PENDING_CRYPTO_RELEASE, icon: Send },
  { state: TradeLegState.COMPLETED, icon: CheckCircle },
  { state: TradeLegState.DISPUTED, icon: ShieldAlert },
  { state: TradeLegState.CANCELLED, icon: XCircle },
];

// Helper to get a canonical state for progress calculation
const getProgressState = (state: TradeLegState | null): TradeLegState | null => {
  if (!state) return null;
  switch (state) {
    case TradeLegState.FIAT_PAID:
      return TradeLegState.PENDING_CRYPTO_RELEASE;
    case TradeLegState.RELEASED:
      return TradeLegState.COMPLETED;
    default:
      return state;
  }
};
// --- End Copied from TradeLegend ---

interface TradeStatusDisplayProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onCreateEscrow?: () => void;
  onFundEscrow?: () => void; // Keep if needed by actions
  onMarkFiatPaid?: () => void;
  onReleaseCrypto?: () => void;
  onDisputeTrade?: () => void;
  onCancelTrade?: () => void;
  loading?: boolean; // Overall loading for actions
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint }; // Keep if needed by ExceptionalCases
  escrowLoading?: boolean; // Keep if needed by ExceptionalCases
  escrowError?: Error | null; // Keep if needed by ExceptionalCases
  balance?: string; // Keep if needed by ExceptionalCases
  refreshEscrow?: () => Promise<void>; // Keep if needed by ExceptionalCases
}

const TradeStatusDisplay: React.FC<TradeStatusDisplayProps> = ({
  trade,
  userRole,
  onCreateEscrow,
  // onFundEscrow, // Not directly used here anymore, but passed to renderActionButtons
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
  const [isOverviewOpen, setIsOverviewOpen] = useState(false); // Collapsed by default

  // --- Logic Copied/Adapted from TradeLegend ---
  const rawCurrentState = Object.values(TradeLegState).includes(trade.leg1_state as TradeLegState)
    ? (trade.leg1_state as TradeLegState)
    : null;

  const currentStateForProgress = getProgressState(rawCurrentState);

  const currentStatusMessage =
    // First check if overall_status is COMPLETED
    trade.overall_status === 'COMPLETED'
      ? tradeStateMessages[TradeLegState.COMPLETED][userRole]
      // Then fall back to the leg1_state message
      : rawCurrentState && tradeStateMessages[rawCurrentState]
        ? tradeStateMessages[rawCurrentState][userRole]
        : 'Trade status unavailable.';

  const progressStates = useMemo(
    () =>
      tradeVisualSteps.filter(
        s => s.state !== TradeLegState.DISPUTED && s.state !== TradeLegState.CANCELLED
      ),
    []
  ); // Memoize progressStates

  const currentIndex = useMemo(
    () =>
      currentStateForProgress
        ? progressStates.findIndex(step => step.state === currentStateForProgress)
        : -1,
    [currentStateForProgress, progressStates]
  );
  // --- End Logic Copied/Adapted ---

  // Helper function to handle action button clicks remains the same
  const handleAction = async (action: TradeAction, handler?: () => Promise<void> | void) => {
    if (!handler || loading) return;
    setLocalLoading(action);
    try {
      await handler();
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    } finally {
      setLocalLoading(null);
    }
  };

  // Get available actions remains the same
  const availableActions = getAvailableActions({
    trade,
    userRole,
    lastLogTime,
    setLastLogTime,
  });

  return (
    <div className="space-y-4 relative">
      {/* Main Status Display */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <StatusBadge className="text-base py-1.5 px-3">{trade.leg1_state}</StatusBadge>
        {/* Updated Status Message */}
        <p className="text-lg font-medium text-right">
          <span className="text-sm font-normal text-muted-foreground mr-1">Current Status:</span>
          {currentStatusMessage}
        </p>
      </div>

      {/* --- Visual Status Overview (Replaces Progress Bar) --- */}
      <Collapsible open={isOverviewOpen} onOpenChange={setIsOverviewOpen} className="w-full">
        <div className="flex justify-end mb-1">
          {' '}
          {/* Button to toggle */}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
              {isOverviewOpen ? 'Hide' : 'Show'} Status Overview
              <ChevronsUpDown className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="flex space-x-1 md:space-x-2 overflow-x-auto py-2 items-stretch border rounded-md p-2 bg-background">
            {tradeVisualSteps.map(step => {
              const message =
                tradeStateMessages[step.state]?.[userRole] ?? step.state.replace(/_/g, ' ');
              const Icon = step.icon;
              const stepIndexInFlow = progressStates.findIndex(s => s.state === step.state);

              let isCompleted = false;
              let isCurrent = false;
              let isFuture = true;

              if (
                step.state === TradeLegState.DISPUTED &&
                rawCurrentState === TradeLegState.DISPUTED
              ) {
                isCurrent = true;
                isFuture = false;
              } else if (
                step.state === TradeLegState.CANCELLED &&
                rawCurrentState === TradeLegState.CANCELLED
              ) {
                isCurrent = true;
                isFuture = false;
              } else if (
                step.state === TradeLegState.COMPLETED &&
                rawCurrentState === TradeLegState.RELEASED
              ) {
                isCompleted = true;
                isFuture = false;
              } else if (stepIndexInFlow !== -1 && currentIndex !== -1) {
                if (stepIndexInFlow < currentIndex) {
                  isCompleted = true;
                  isFuture = false;
                } else if (stepIndexInFlow === currentIndex) {
                  isCurrent = true;
                  isFuture = false;
                }
              } else if (
                stepIndexInFlow !== -1 &&
                rawCurrentState === TradeLegState.COMPLETED &&
                step.state === TradeLegState.COMPLETED
              ) {
                isCompleted = true;
                isFuture = false;
              }

              const boxStyle = cn(
                'flex-1 flex flex-col items-center justify-start p-2 rounded-md border text-center min-w-[100px] transition-colors duration-200', // Base
                isCurrent && step.state === TradeLegState.DISPUTED
                  ? 'border-orange-500 bg-orange-500/10 text-orange-700 shadow-md'
                  : isCurrent && step.state === TradeLegState.CANCELLED
                  ? 'border-red-500 bg-red-500/10 text-red-700 shadow-md'
                  : isCurrent
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-700 shadow-md' // Pending - Yellow
                  : isCompleted
                  ? 'border-green-500 bg-green-500/10 text-green-700' // Completed - Green
                  : isFuture
                  ? 'text-muted-foreground opacity-60 border-border bg-card' // Future - Muted
                  : 'border-border bg-card' // Default
              );
              const iconStyle = cn(
                'h-5 w-5 mb-1.5', // Base
                isCurrent && step.state === TradeLegState.DISPUTED
                  ? 'text-orange-600'
                  : isCurrent && step.state === TradeLegState.CANCELLED
                  ? 'text-red-600'
                  : isCurrent
                  ? 'text-yellow-600' // Pending Icon - Yellow
                  : isCompleted
                  ? 'text-green-600' // Completed Icon - Green
                  : isFuture
                  ? 'text-muted-foreground'
                  : ''
              );

              return (
                <div key={step.state} className={boxStyle}>
                  <Icon className={iconStyle} />
                  <span className="text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                    {step.state.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-medium leading-tight">{message}</span>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
      {/* --- End Visual Status Overview --- */}

      {/* Render Timers, Actions, Exceptional Cases, Escrow Details as before */}
      {renderTimers({ trade, userRole })}
      {renderActionButtons({
        availableActions,
        loading,
        localLoading,
        handleAction,
        onCreateEscrow,
        // onFundEscrow, // Pass if needed by actions
        onMarkFiatPaid,
        onReleaseCrypto,
        onDisputeTrade,
        onCancelTrade,
      })}

      <ExceptionalCases
        trade={trade}
        userRole={userRole}
        escrowDetails={escrowDetails}
        balance={balance}
        refreshEscrow={refreshEscrow}
      />

      {trade.leg1_escrow_onchain_id && (
        <EscrowDetailsPanel
          escrowId={trade.leg1_escrow_onchain_id}
          trade={trade}
          userRole={userRole}
        />
      )}
      <TransactionHistory tradeId={trade.id} />
    </div>
  );
};

export default TradeStatusDisplay;
