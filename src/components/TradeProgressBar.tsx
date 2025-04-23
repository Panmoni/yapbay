import React from "react";
import { Trade } from "@/api";
import { TradeLegState } from "@/utils/tradeStates";

interface TradeProgressBarProps {
  state: Trade['leg1_state'];
  isExceptional?: boolean;
}

const TradeProgressBar: React.FC<TradeProgressBarProps> = ({ state, isExceptional = false }) => {
  // Map states to progress percentages - aligned with TradeLegState enum
  const stateToProgress: Record<string, number> = {
    [TradeLegState.CREATED]: 0,
    [TradeLegState.FUNDED]: 33,
    [TradeLegState.FIAT_PAID]: 66,
    [TradeLegState.RELEASED]: 90,
    [TradeLegState.COMPLETED]: 100,
    [TradeLegState.DISPUTED]: 75,
    [TradeLegState.RESOLVED]: 90,
    [TradeLegState.CANCELLED]: 0,
    // Legacy state mappings for backward compatibility
    'AWAITING_FIAT_PAYMENT': 50,
    'PENDING_CRYPTO_RELEASE': 75
  };

  // Map states to user-friendly labels
  const stateToLabel: Record<string, string> = {
    [TradeLegState.CREATED]: 'Trade Created',
    [TradeLegState.FUNDED]: 'Escrow Funded',
    [TradeLegState.FIAT_PAID]: 'Fiat Payment Confirmed',
    [TradeLegState.RELEASED]: 'Crypto Released',
    [TradeLegState.COMPLETED]: 'Trade Completed',
    [TradeLegState.DISPUTED]: 'Under Dispute',
    [TradeLegState.RESOLVED]: 'Dispute Resolved',
    [TradeLegState.CANCELLED]: 'Trade Cancelled',
    // Legacy state mappings for backward compatibility
    'AWAITING_FIAT_PAYMENT': 'Awaiting Fiat Payment',
    'PENDING_CRYPTO_RELEASE': 'Pending Crypto Release'
  };

  const progress = stateToProgress[state] || 0;
  const label = stateToLabel[state] || 'Unknown State';

  // Define 4 milestone steps for the trade process
  const milestones = [
    { label: 'Created', position: 0, completed: progress >= 0 },
    { label: 'Escrow Funded', position: 33, completed: progress >= 33 },
    { label: 'Fiat Paid', position: 66, completed: progress >= 66 },
    { label: 'Completed', position: 100, completed: progress >= 100 }
  ];

  // Determine progress bar color based on state
  const getProgressBarColor = () => {
    if (isExceptional) return 'bg-red-500';
    if (state === TradeLegState.DISPUTED) return 'bg-amber-500';
    if (state === TradeLegState.CANCELLED) return 'bg-neutral-500';
    return 'bg-primary-600';
  };

  // Create our own progress bar instead of using the shadcn component
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">Progress: {label}</div>
        <div className="text-sm text-neutral-500">{progress}%</div>
      </div>

      <div className="relative pt-4 pb-8">
        {/* Custom progress bar */}
        <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor()} rounded-full transition-all duration-500 ease-in-out`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Milestone markers */}
        <div className="absolute top-3 left-0 right-0 w-full">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className="absolute"
              style={{ left: `${milestone.position}%`, transform: 'translateX(-50%)' }}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 ${
                  milestone.completed
                    ? state === TradeLegState.CANCELLED
                      ? 'bg-neutral-500 border-neutral-600'
                      : state === TradeLegState.DISPUTED
                        ? 'bg-amber-500 border-amber-600'
                        : isExceptional
                          ? 'bg-red-500 border-red-600'
                          : 'bg-primary-600 border-primary-700'
                    : 'bg-neutral-200 border-neutral-300'
                } -mt-1 ${
                  // Add pulsing animation for current milestone
                  (progress >= milestone.position &&
                   (index === milestones.length - 1 ? progress === 100 : progress < milestones[index + 1]?.position))
                    ? 'animate-pulse'
                    : ''
                }`}
              />
              <div
                className={`mt-2 text-xs text-center whitespace-nowrap ${
                  milestone.completed ? 'text-primary-700 font-medium' : 'text-neutral-500'
                }`}
                style={{
                  transform: 'translateX(-50%)',
                  width: '80px',
                  marginLeft: '40px'
                }}
              >
                {milestone.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TradeProgressBar;
