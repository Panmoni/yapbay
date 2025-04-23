import React, { useState } from "react";
import { Trade } from "@/api";
import { EscrowState } from "@/hooks/useEscrowDetails";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { checkAndFundEscrow } from "@/services/blockchainService";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExceptionalCasesProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}

/**
 * Component that renders exceptional cases for trade status
 * Currently handles:
 * - Escrow is FUNDED in backend but not fully funded on-chain
 *
 * Can be expanded to handle other exceptional cases in the future
 */
export const ExceptionalCases: React.FC<ExceptionalCasesProps> = ({
  trade,
  userRole,
  escrowDetails,
  balance,
  refreshEscrow
}) => {
  // Use dynamic context for wallet access
  const { primaryWallet } = useDynamicContext();
  const [fundLoading, setFundLoading] = useState(false);

  // Exceptional case: Escrow is FUNDED in backend but not fully funded on-chain
  if (trade.leg1_state === "FUNDED" &&
      escrowDetails &&
      Number(escrowDetails.state) === EscrowState.CREATED &&
      parseFloat(balance || "0") < Number(escrowDetails.amount)) {
    return (
      <Alert className="mb-2 border-amber-300 bg-amber-50">
        {userRole === "seller" ? (
          <>
            <AlertTitle className="text-amber-900">Action Required</AlertTitle>
            <AlertDescription className="text-amber-900">
              The escrow is created, but the on-chain balance is insufficient. You must fully fund the escrow to proceed.
              
              <div className="mt-3">
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
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertTitle className="text-amber-900">Warning</AlertTitle>
            <AlertDescription className="text-amber-900">
              The escrow is not yet fully funded on-chain. Do not make the fiat payment until the seller has fully funded the escrow.
            </AlertDescription>
          </>
        )}
      </Alert>
    );
  }

  return null;
};