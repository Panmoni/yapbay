import { Trade } from '@/api';
import TradeTimer from './TradeTimer';
import { isDeadlineExpired } from '@/hooks/useTradeUpdates';

interface RenderTimersProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
}

/**
 * Renders timers with deadline enforcement, info text, and decision logs
 */
export const renderTimers = ({ trade, userRole }: RenderTimersProps) => {
  // console.log(`[DEBUG] User-requested decision logic: Evaluating renderTimers for state: ${trade.leg1_state}`);

  if (trade.leg1_state === 'CREATED' && trade.leg1_escrow_deposit_deadline) {
    const isExpired = isDeadlineExpired(trade.leg1_escrow_deposit_deadline);
    // console.log(`[DEBUG] User-requested decision logic: Rendering timer for CREATED state. Deadline: ${trade.leg1_escrow_deposit_deadline}, Expired: ${isExpired}`);
    return (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <TradeTimer
          deadline={trade.leg1_escrow_deposit_deadline}
          label={
            userRole === 'seller'
              ? 'Time remaining to fund escrow:'
              : 'Waiting for seller to fund escrow:'
          }
        />
        {isExpired ? (
          <p className="text-red-600 text-sm mt-2">
            Deadline expired: The deposit deadline has passed. Actions may be unavailable.
          </p>
        ) : (
          <p className="text-amber-800 text-sm mt-2">
            {userRole === 'seller' 
              ? "Deadline warning: Fund the escrow before the deadline to avoid trade failure."
              : "Deadline warning: The seller must fund the escrow before the deadline to avoid trade failure. At this step, you, the buyer, can only wait for the seller to do so."}
          </p>
        )}
      </div>
    );
  }

  // Add timer for FUNDED state with fiat payment deadline
  if (trade.leg1_state === 'FUNDED' && trade.leg1_fiat_payment_deadline) {
    const isExpired = isDeadlineExpired(trade.leg1_fiat_payment_deadline);
    // console.log(`[DEBUG] User-requested decision logic: Rendering timer for FUNDED state. Deadline: ${trade.leg1_fiat_payment_deadline}, Expired: ${isExpired}`);
    return (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <TradeTimer
          deadline={trade.leg1_fiat_payment_deadline}
          label={
            userRole === 'buyer'
              ? 'Time remaining to mark fiat as paid:'
              : 'Waiting for buyer to mark fiat as paid:'
          }
        />
        {isExpired ? (
          <p className="text-red-600 text-sm mt-2">
            Deadline expired: The fiat payment deadline has passed. The trade may be canceled.
          </p>
        ) : (
          <p className="text-amber-800 text-sm mt-2">
            {userRole === 'buyer' 
              ? "Deadline warning: Mark fiat as paid before the deadline to proceed."
              : "Deadline warning: The buyer must mark fiat as paid before the deadline to proceed. Do not release escrow until you have personally verified receipt of the fiat funds via your payment method. Do not trust receipt images, promises or even the buyer having marked fiat as paid on-chain."}
          </p>
        )}
      </div>
    );
  }

  if (trade.leg1_state === 'AWAITING_FIAT_PAYMENT' && trade.leg1_fiat_payment_deadline) {
    const isExpired = isDeadlineExpired(trade.leg1_fiat_payment_deadline);
    // console.log(`[DEBUG] User-requested decision logic: Rendering timer for AWAITING_FIAT_PAYMENT state. Deadline: ${trade.leg1_fiat_payment_deadline}, Expired: ${isExpired}`);
    return (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <TradeTimer
          deadline={trade.leg1_fiat_payment_deadline}
          label={
            userRole === 'buyer'
              ? 'Time remaining to make payment:'
              : 'Waiting for buyer to make payment:'
          }
        />
        {isExpired ? (
          <p className="text-red-600 text-sm mt-2">
            Deadline expired: The payment deadline has passed. The trade may be canceled.
          </p>
        ) : (
          <p className="text-amber-800 text-sm mt-2">
            Deadline warning: Complete payment before the deadline to proceed.
          </p>
        )}
      </div>
    );
  }

  // console.log(`[DEBUG] User-requested decision logic: No timers to render for state: ${trade.leg1_state}`);
  return null;
};
