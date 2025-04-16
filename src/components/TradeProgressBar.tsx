import React from "react";
import { Trade } from "@/api";

interface TradeProgressBarProps {
  state: Trade['leg1_state'];
}

const TradeProgressBar: React.FC<TradeProgressBarProps> = ({ state }) => {
  // Map states to progress percentages
  const stateToProgress: Record<string, number> = {
    'CREATED': 10,
    'AWAITING_FIAT_PAYMENT': 40,
    'PENDING_CRYPTO_RELEASE': 70,
    'DISPUTED': 85,
    'COMPLETED': 100,
    'CANCELLED': 0
  };

  // Map states to user-friendly labels
  const stateToLabel: Record<string, string> = {
    'CREATED': 'Trade Created',
    'AWAITING_FIAT_PAYMENT': 'Awaiting Fiat Payment',
    'PENDING_CRYPTO_RELEASE': 'Pending Crypto Release',
    'DISPUTED': 'Under Dispute',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  };

  const progress = stateToProgress[state] || 0;
  const label = stateToLabel[state] || 'Unknown State';

  // Define milestone steps for the trade process
  const milestones = [
    { label: 'Created', position: 10, completed: progress >= 10 },
    { label: 'Escrow Funded', position: 40, completed: progress >= 40 },
    { label: 'Fiat Paid', position: 70, completed: progress >= 70 },
    { label: 'Completed', position: 100, completed: progress >= 100 }
  ];

  // Create our own progress bar instead of using the shadcn component
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">Progress: {label}</div>
        <div className="text-sm text-gray-500">{progress}%</div>
      </div>

      <div className="relative pt-4 pb-8">
        {/* Custom progress bar */}
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-500 ease-in-out"
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
                    ? 'bg-purple-600 border-purple-700'
                    : 'bg-gray-200 border-gray-300'
                } -mt-1`}
              />
              <div
                className={`mt-2 text-xs text-center whitespace-nowrap ${
                  milestone.completed ? 'text-purple-700 font-medium' : 'text-gray-500'
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
