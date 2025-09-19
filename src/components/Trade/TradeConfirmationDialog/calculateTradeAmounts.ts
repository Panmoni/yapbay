import { Offer, PricesResponse } from '@/api';

interface CalculateTradeAmountsResult {
  fiatAmount: number;
  platformFee: number;
  error: string | null;
}

/**
 * Calculate fiat amount and platform fee based on USDC amount and offer details
 */
export const calculateTradeAmounts = (
  amount: string,
  offer: Offer,
  priceData: PricesResponse | null
): CalculateTradeAmountsResult => {
  const result: CalculateTradeAmountsResult = {
    fiatAmount: 0,
    platformFee: 0,
    error: null,
  };

  if (!priceData || !amount) return result;

  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return result;
    }

    // Get base price for the token in the offer's currency
    const basePrice =
      priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]?.price;
    if (!basePrice) {
      result.error = `Price data not available for ${offer.fiat_currency}`;
      return result;
    }

    // Apply rate adjustment from the offer
    const adjustedPrice = parseFloat(basePrice) * offer.rate_adjustment;

    // Calculate fiat amount
    result.fiatAmount = numAmount * adjustedPrice;

    // Calculate platform fee - always 1% of USDC amount
    // The seller always pays the fee in USDC, regardless of offer type
    result.platformFee = numAmount * 0.01; // 1% of USDC amount

    return result;
  } catch (error) {
    console.error('Error calculating amounts:', error);
    result.error = 'Error calculating trade amounts. Please try again.';
    return result;
  }
};
