import { Trade } from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import TradeStatusDisplay from '@/components/Trade/TradeStatusDisplay';

interface TradeStatusCardProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  actions: {
    createEscrow: () => Promise<void>;
    markFiatPaid: () => Promise<void>;
    releaseCrypto: () => Promise<void>;
    disputeTrade: () => Promise<void>;
    cancelTrade: () => Promise<void>;
  };
  actionLoading: boolean;
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  escrowLoading?: boolean;
  escrowError?: Error | null;
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}

/**
 * Card component that displays the trade status and actions
 */
export function TradeStatusCard({
  trade,
  userRole,
  actions,
  actionLoading,
  escrowDetails,
  escrowLoading,
  escrowError,
  balance,
  refreshEscrow,
}: TradeStatusCardProps) {
  // Log trade state changes only
  console.log(`[TradeStatusCard] Trade ${trade?.id} state: ${trade?.leg1_state}`);

  return (
    <Card className="border border-neutral-200 shadow-sm p-4">
      <CardHeader>
        <CardTitle className="text-primary-800">Trade Status</CardTitle>
        <CardDescription>Current status and progress of this trade</CardDescription>
      </CardHeader>
      <CardContent>
        <TradeStatusDisplay
          trade={trade}
          userRole={userRole}
          onCreateEscrow={actions.createEscrow}
          onMarkFiatPaid={actions.markFiatPaid}
          onReleaseCrypto={actions.releaseCrypto}
          onDisputeTrade={actions.disputeTrade}
          onCancelTrade={actions.cancelTrade}
          loading={actionLoading}
          escrowDetails={escrowDetails}
          escrowLoading={escrowLoading}
          escrowError={escrowError}
          balance={balance}
          refreshEscrow={refreshEscrow}
        />
      </CardContent>
    </Card>
  );
}
