import { Trade } from '@/api';
import { TradeAction } from './TradeActionButton';
import { isDeadlineExpired } from '@/hooks/useTradeUpdates';

interface GetAvailableActionsProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  lastLogTime: number;
  setLastLogTime: (time: number) => void;
}

/**
 * Determines which actions are available based on state, role, and time conditions
 */
export const getAvailableActions = ({
  trade,
  userRole,
  lastLogTime,
  setLastLogTime,
}: GetAvailableActionsProps): TradeAction[] => {
  // Early exit if trade is invalid or missing required properties
  if (!trade || !trade.id) {
    console.warn('getAvailableActions: Invalid trade object', trade);
    return [];
  }

  // Early exit for terminal states
  const terminalStates = ['COMPLETED', 'CANCELLED'];
  if (terminalStates.includes(trade.leg1_state ?? '')) {
    return [];
  }

  const currentTime = Date.now();
  if (currentTime - lastLogTime >= 30000) {
    console.log('Evaluating available actions for:', {
      state: trade.leg1_state,
      userRole,
      escrowDeadlineExpired: isDeadlineExpired(trade.leg1_escrow_deposit_deadline ?? ''),
      fiatPaymentDeadlineExpired: isDeadlineExpired(trade.leg1_fiat_payment_deadline ?? ''),
    });
    setLastLogTime(currentTime);
  }

  // Determine if deadlines have expired
  const escrowDeadlineExpired = isDeadlineExpired(trade.leg1_escrow_deposit_deadline ?? '');
  const fiatPaymentDeadlineExpired = isDeadlineExpired(trade.leg1_fiat_payment_deadline ?? '');

  switch (trade.leg1_state) {
    case 'CREATED':
      // console.log('Trade is in CREATED state');
      if (userRole === 'seller') {
        // Removed log: console.log('User is seller, escrow deadline expired:', escrowDeadlineExpired);
        return escrowDeadlineExpired ? ['cancel'] : ['create_escrow'];
      }
      // Removed log: console.log('User is buyer, no actions available');
      return [];

    case 'FUNDED':
      // console.log('Trade is in FUNDED state');
      if (userRole === 'buyer') {
        // Removed log: console.log('User is buyer, showing mark_paid button');
        return ['mark_paid'];
      } else if (userRole === 'seller' && fiatPaymentDeadlineExpired) {
        // Removed log: console.log('User is seller, fiat payment deadline expired:', fiatPaymentDeadlineExpired);
        return ['cancel'];
      }
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

    case 'FIAT_PAID':
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
