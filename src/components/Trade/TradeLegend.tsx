import React from 'react';
import { Trade, Offer } from '@/api'; // Single Offer import
import { TradeLegState, tradeStateMessages } from '@/utils/tradeStates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseTimeLimit } from '@/utils/stringUtils'; // Assuming this utility exists

interface TradeLegendProps {
  trade: Trade | null;
  offer: Offer | null;
  userRole: 'buyer' | 'seller';
}

// Define the standard trade flow steps (numbers removed, handled by <ol>)
const tradeFlowSteps: { state: TradeLegState; title: string }[] = [
  { state: TradeLegState.CREATED, title: 'Escrow Creation' },
  { state: TradeLegState.AWAITING_FIAT_PAYMENT, title: 'Fiat Payment' }, // Represents the phase after funding
  { state: TradeLegState.PENDING_CRYPTO_RELEASE, title: 'Crypto Release' }, // After buyer marks paid
  { state: TradeLegState.COMPLETED, title: 'Trade Completed' }, // Includes RELEASED
];

// Helper function to generate descriptions dynamically based on offer details
const generateStepDescriptions = (
  offer: Offer | null
): Record<TradeLegState, Record<'buyer' | 'seller', string>> => {
  // Provide default text if offer or limits are missing
  const escrowTimeLimit = offer?.escrow_deposit_time_limit
    ? parseTimeLimit(offer.escrow_deposit_time_limit)
    : 'the specified time';
  const fiatTimeLimit = offer?.fiat_payment_time_limit
    ? parseTimeLimit(offer.fiat_payment_time_limit)
    : 'the specified time';

  return {
    [TradeLegState.CREATED]: {
      buyer: `The trade has started. The seller now needs to create a secure, on-chain escrow contract and deposit the agreed amount of cryptocurrency into it within ${escrowTimeLimit}. This ensures the crypto is held safely until payment is confirmed. Please wait for the seller to complete this action.`,
      seller: `You need to initiate the trade by creating the secure escrow contract and depositing the agreed cryptocurrency amount within ${escrowTimeLimit}. Click the "Create & Fund Escrow" button. This locks the crypto and assures the buyer it's ready for transfer upon their payment. Failure to fund within the time limit may lead to cancellation.`,
    },
    [TradeLegState.AWAITING_FIAT_PAYMENT]: {
      buyer: `The seller has successfully funded the escrow! The crypto is now securely held. Your next step is to send the agreed fiat amount directly to the seller using the payment method specified in the trade terms within ${fiatTimeLimit}. After sending the payment, click the "Mark Fiat Paid" button to notify the seller. Failure to pay and mark as paid within the time limit may lead to cancellation or dispute.`,
      seller: `You have successfully funded the escrow. The crypto is secured. Now, patiently wait for the buyer to send the fiat payment to your specified account/method and mark the payment as complete within ${fiatTimeLimit}. Keep communication channels open if needed. If the buyer exceeds the time limit, you may be able to cancel or dispute.`,
    },
    [TradeLegState.PENDING_CRYPTO_RELEASE]: {
      buyer:
        "You have marked the fiat payment as sent. The seller has been notified. Please allow the seller time to verify that they have received the correct fiat amount in their account. Once they confirm receipt, they will release the crypto from escrow to your wallet. There's usually a reasonable timeframe expected for verification.",
      seller:
        'The buyer has indicated they\'ve sent the fiat payment. Please carefully verify that you have received the full and correct amount in your designated account according to the trade terms. Once you are certain the payment is complete and correct, click the "Release Crypto" button promptly to transfer the escrowed funds to the buyer\'s wallet. Delays may lead to disputes.',
    },
    [TradeLegState.COMPLETED]: {
      buyer:
        'Success! The seller has verified your payment and released the cryptocurrency from escrow. The funds should now be reflected in your connected wallet. This trade is now complete. Thank you for using YapBay!',
      seller:
        'You have successfully released the crypto to the buyer after confirming their fiat payment. The trade is now complete, and the fiat funds are yours. Thank you for using YapBay!',
    },
    // Other states with deadline context where relevant
    [TradeLegState.FUNDED]: {
      buyer: `The seller has successfully deposited the crypto into the secure escrow within their time limit (${escrowTimeLimit}). The next step is for you to make the fiat payment within ${fiatTimeLimit}.`,
      seller: `You have successfully deposited the crypto into the escrow within the time limit (${escrowTimeLimit}). Waiting for the buyer to proceed with the fiat payment within ${fiatTimeLimit}.`,
    },
    [TradeLegState.FIAT_PAID]: {
      buyer: `You have marked the fiat payment as sent within your time limit (${fiatTimeLimit}). Waiting for the seller to verify receipt and release the crypto.`,
      seller: `The buyer has marked the fiat payment as sent within their time limit (${fiatTimeLimit}). Please verify receipt promptly before releasing the crypto.`,
    },
    [TradeLegState.RELEASED]: {
      buyer:
        'The seller has released the crypto from escrow. The funds are being sent to your wallet. The trade is effectively complete.',
      seller:
        "You have released the crypto from escrow. The funds are being sent to the buyer's wallet. The trade is effectively complete.",
    },
    [TradeLegState.DISPUTED]: {
      buyer:
        'A dispute has been initiated for this trade, pausing the normal process and deadlines. Both parties may be required to submit evidence. Please follow any instructions provided by the platform or arbitrator carefully and communicate through official channels regarding the dispute.',
      seller:
        'A dispute has been initiated for this trade, pausing the normal process and deadlines. Both parties may be required to submit evidence. Please follow any instructions provided by the platform or arbitrator carefully and communicate through official channels regarding the dispute.',
    },
    [TradeLegState.CANCELLED]: {
      buyer:
        'This trade has been cancelled. This could be due to expiry of a time limit, mutual agreement, or other reasons. No crypto will be transferred, and no fiat payment is expected (or should be returned if already sent before cancellation).',
      seller:
        'This trade has been cancelled. This could be due to expiry of a time limit, mutual agreement, or other reasons. If you had already funded the escrow, the cryptocurrency should be automatically returned to your wallet. No fiat payment is expected from the buyer.',
    },
    [TradeLegState.RESOLVED]: {
      buyer:
        'The dispute associated with this trade has been resolved by the arbitrator. Check the final status and any notifications for details on the outcome, which may involve crypto release to one party or a return to the seller.',
      seller:
        'The dispute associated with this trade has been resolved by the arbitrator. Check the final status and any notifications for details on the outcome, which may involve crypto release to the buyer or a return to your wallet.',
    },
  };
};

const TradeLegend: React.FC<TradeLegendProps> = ({ trade, offer, userRole }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  // Generate descriptions based on offer, memoized for performance
  const stepDescriptions = React.useMemo(() => generateStepDescriptions(offer), [offer]);

  if (!trade) {
    return null; // Don't render if trade is missing
  }

  // Determine the current state, handling potential invalid states
  const currentState = Object.values(TradeLegState).includes(trade.leg1_state as TradeLegState)
    ? (trade.leg1_state as TradeLegState)
    : null;

  // Map current API state to the closest *action* step state for highlighting
  const getCurrentFlowState = (): TradeLegState | null => {
    if (!currentState) return null;
    switch (currentState) {
      case TradeLegState.CREATED:
        return TradeLegState.CREATED; // Seller action needed
      case TradeLegState.FUNDED: // Seller finished funding, now buyer needs to pay
      case TradeLegState.AWAITING_FIAT_PAYMENT:
        return TradeLegState.AWAITING_FIAT_PAYMENT; // Buyer action needed
      case TradeLegState.FIAT_PAID: // Buyer finished paying, now seller needs to release
      case TradeLegState.PENDING_CRYPTO_RELEASE:
        return TradeLegState.PENDING_CRYPTO_RELEASE; // Seller action needed
      case TradeLegState.RELEASED: // Seller finished releasing
      case TradeLegState.COMPLETED:
        return TradeLegState.COMPLETED; // Trade finished
      // Non-flow states (Disputed, Cancelled) won't highlight a standard step
      default:
        return null;
    }
  };
  const currentFlowState = getCurrentFlowState();

  // Get the overall status message for the current actual state
  const currentStatusMessage =
    currentState && tradeStateMessages[currentState]
      ? tradeStateMessages[currentState][userRole]
      : 'Trade status unavailable.';

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>How Trading Works</CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle Legend</span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground mb-4">
            Current Status: <span className="font-medium">{currentStatusMessage}</span>
          </p>
          <CollapsibleContent>
            <ol className="space-y-3 list-decimal list-inside">
              {tradeFlowSteps.map(step => {
                // Use the dynamically generated descriptions
                const description =
                  stepDescriptions[step.state]?.[userRole] ?? 'No description available.';
                const isCurrent = step.state === currentFlowState;

                return (
                  <li
                    key={step.state}
                    className={cn(
                      'text-sm',
                      isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <span className={cn(isCurrent ? 'font-bold' : '')}>{step.title}:</span>{' '}
                    {description}
                  </li>
                );
              })}
            </ol>

            {/* General Info about Disputes and Cancellations (no border) */}
            <div className="mt-4 pt-3">
              {' '}
              {/* Removed border-t */}
              <h4 className="text-sm font-semibold mb-1">Disputes & Cancellations</h4>
              <p className="text-xs text-muted-foreground mb-2">
                If issues arise, either party can initiate a dispute before the trade completes.
                This pauses the trade (including deadlines) for resolution by an arbitrator. Trades
                can also be cancelled under certain conditions (e.g., expiry of deadlines, mutual
                agreement). Use the chat for communication, but rely on the dispute process for
                formal resolution if needed.
              </p>
            </div>

            {/* Add notes for *currently active* exceptional states (no border) */}
            {(currentState === TradeLegState.DISPUTED ||
              currentState === TradeLegState.CANCELLED ||
              currentState === TradeLegState.RESOLVED) && (
              <div className="mt-2 pt-2">
                {' '}
                {/* Removed border-t and border-dashed */}
                <p className="text-sm font-semibold">Current Exception:</p>
                {/* Display the detailed message for the current exceptional state */}
                <p className="text-sm text-muted-foreground">
                  {stepDescriptions[currentState]?.[userRole] ?? 'Details for the current state.'}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};

export default TradeLegend;
