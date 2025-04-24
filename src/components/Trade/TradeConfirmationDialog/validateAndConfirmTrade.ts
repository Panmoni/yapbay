import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';

interface ValidateTradeResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validate trade parameters before confirming
 */
export const validateTrade = (amount: string, offer: Offer): ValidateTradeResult => {
  const result: ValidateTradeResult = {
    isValid: true,
    error: null,
  };

  if (!amount || parseFloat(amount) <= 0) {
    result.isValid = false;
    result.error = 'Please enter a valid amount';
    return result;
  }

  const numAmount = parseFloat(amount);

  // Validate against min/max offer amounts
  if (numAmount < offer.min_amount) {
    result.isValid = false;
    result.error = `Amount must be at least ${formatNumber(offer.min_amount)} ${offer.token}`;
    return result;
  }

  if (numAmount > offer.max_amount) {
    result.isValid = false;
    result.error = `Amount cannot exceed ${formatNumber(offer.max_amount)} ${offer.token}`;
    return result;
  }

  if (numAmount > offer.total_available_amount) {
    result.isValid = false;
    result.error = `Amount exceeds available amount of ${formatNumber(
      offer.total_available_amount
    )} ${offer.token}`;
    return result;
  }

  return result;
};

/**
 * Validate and confirm trade if valid
 */
export const confirmTrade = (
  amount: string,
  offer: Offer,
  fiatAmount: number,
  onConfirm: (leg1_offer_id: number, leg1_crypto_amount: string, leg1_fiat_amount: number) => void,
  setError: (error: string | null) => void
): boolean => {
  const validation = validateTrade(amount, offer);

  if (!validation.isValid) {
    setError(validation.error);
    return false;
  }

  const numAmount = parseFloat(amount);
  // Pass the amount as a decimal string directly
  const formattedAmount = numAmount.toString();

  // Log the data being sent (using API parameter names)
  console.log('Initiating trade with data:', {
    leg1_offer_id: offer.id,
    leg1_crypto_amount: formattedAmount,
    leg1_fiat_amount: fiatAmount,
  });

  // Call onConfirm with parameters matching the updated prop signature
  onConfirm(offer.id, formattedAmount, fiatAmount);
  return true;
};
