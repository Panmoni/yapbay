import React, { useState } from "react";
import { Trade } from "@/api";
import StatusBadge from "./StatusBadge";
import TradeProgressBar from "./TradeProgressBar";
import TradeTimer from "./TradeTimer";
import TradeActionButton, { TradeAction } from "./TradeActionButton";
import { isDeadlineExpired } from "@/hooks/useTradeUpdates";
import { EscrowDetailsPanel } from "./EscrowDetailsPanel";
import { EscrowState } from "@/hooks/useEscrowDetails";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { checkAndFundEscrow } from "@/services/blockchainService";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const { primaryWallet } = useDynamicContext();
  const [fundLoading, setFundLoading] = useState(false);

  // Map states to user-friendly messages based on role
  const stateMessages: Record<string, Record<string, string>> = {
    'CREATED': {
      buyer: "Waiting for seller to create and fund escrow",
      seller: "You need to create and fund the escrow"
    },
    'FUNDED': {
      buyer: "Escrow created, pending funding by seller",
      seller: "Escrow created, pending your funding"
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
    const currentTime = Date.now();
    if (currentTime - lastLogTime >= 30000) {
      console.log('Evaluating available actions for:', {
        state: trade.leg1_state,
        userRole,
        escrowDeadlineExpired,
        fiatPaymentDeadlineExpired
      });
      setLastLogTime(currentTime);
    }

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
      {/* DEBUG PANEL: Remove after troubleshooting */}
      {/* <div className="p-2 mb-2 bg-gray-100 border border-gray-300 rounded text-xs">
        <div><b>DEBUG:</b></div>
        <div>trade.leg1_state: {String(trade.leg1_state)} (type: {typeof trade.leg1_state})</div>
        <div>escrowDetails?.state: {escrowDetails ? String(escrowDetails.state) : "undefined"} (type: {escrowDetails ? typeof escrowDetails.state : "undefined"})</div>
        <div>EscrowState.CREATED: {String(EscrowState.CREATED)} (type: {typeof EscrowState.CREATED})</div>
        <div>balance: {String(balance || "0")} (type: {typeof (balance || "string")})</div>
        <div>parseFloat(balance || "0") === 0: {String(parseFloat(balance || "0") === 0)}</div>
        <div>trade.leg1_state === "FUNDED": {String(trade.leg1_state === "FUNDED")}</div>
        <div>escrowDetails?.state === EscrowState.CREATED: {String(escrowDetails ? Number(escrowDetails.state) === EscrowState.CREATED : false)}</div>
        <div>
          ALERT CONDITIONAL: {String(
            trade.leg1_state === "FUNDED" &&
            escrowDetails &&
            Number(escrowDetails.state) === EscrowState.CREATED &&
            parseFloat(balance || "0") === 0
          )}
        </div>
      </div> */}
      {/* {console.log(
        "[ALERT DEBUG]",
        {
          "trade.leg1_state": trade.leg1_state,
          "escrowDetails?.state": escrowDetails ? escrowDetails.state : undefined,
          "EscrowState.CREATED": EscrowState.CREATED,
          "balance": balance || "0",
          "parseFloat(balance || '0') === 0": parseFloat(balance || "0") === 0,
          "trade.leg1_state === 'FUNDED'": trade.leg1_state === "FUNDED",
          "escrowDetails?.state === EscrowState.CREATED": escrowDetails ? Number(escrowDetails.state) === EscrowState.CREATED : false,
          "ALERT CONDITIONAL": (
            trade.leg1_state === "FUNDED" &&
            escrowDetails &&
            Number(escrowDetails.state) === EscrowState.CREATED &&
            parseFloat(balance || "0") === 0
          )
        }
      )} */}


      <div className="flex items-center justify-between">
        <StatusBadge className="text-base py-1.5 px-3">{trade.leg1_state}</StatusBadge>
        <p className="text-lg font-medium">{message}</p>
      </div>

      <TradeProgressBar
        state={trade.leg1_state}
        isExceptional={trade.leg1_state === "FUNDED" && escrowDetails && Number(escrowDetails.state) === EscrowState.CREATED && parseFloat(balance || "0") < Number(escrowDetails.amount)}
      />

      {renderTimers()}
      {renderActionButtons()}

      {/* Exceptional case: Escrow is FUNDED in backend but not fully funded on-chain */}
      {trade.leg1_state === "FUNDED" &&
       escrowDetails &&
       Number(escrowDetails.state) === EscrowState.CREATED &&
       parseFloat(balance || "0") < Number(escrowDetails.amount) && (
          <div className="p-4 mb-2 rounded-md border border-amber-300 bg-amber-50 flex flex-col gap-2">
            {userRole === "seller" ? (
              <>
                <div className="text-amber-900">
                  <span className="font-semibold"> Action Required</span>: The escrow is created, but the on-chain balance is insufficient. You must fully fund the escrow to proceed.
                </div>
                <div>
                  <Button
                    onClick={async () => {
                      if (!primaryWallet || !escrowDetails) return;
                      setFundLoading(true);
                      try {
                        toast.info("Checking token allowance and funding escrow...", {
                          description: "Please approve the transactions in your wallet.",
                        });
                        await checkAndFundEscrow(
                          primaryWallet,
                          escrowDetails.escrow_id.toString(),
                          escrowDetails.amount.toString()
                        );
                        toast.success("Escrow funded successfully!");
                        if (refreshEscrow) await refreshEscrow();
                      } catch (err) {
                        // @ts-expect-error - TypeScript may not recognize the message property on err
                        toast.error(`Escrow Funding Failed: ${err?.message || "Unknown error"}`);
                      } finally {
                        setFundLoading(false);
                      }
                    }}
                    disabled={fundLoading}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {fundLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={16} className="animate-spin" />
                        Funding...
                      </span>
                    ) : (
                      "Fund Escrow Now"
                    )}
                  </Button>
                  <p className="text-xs text-neutral-600 mt-1">
                    This will check your token allowance and fund the escrow in one or two transactions.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-amber-900">
                <span className="font-semibold">Warning</span>: The escrow is not yet fully funded on-chain. Do not make the fiat payment until the seller has fully funded the escrow.
              </div>
            )}
          </div>
        )}

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
