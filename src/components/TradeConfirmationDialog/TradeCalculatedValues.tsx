import React from 'react';
import { Offer } from '../../api';
import { formatNumber } from '../../lib/utils';

interface TradeCalculatedValuesProps {
  offer: Offer;
  amount: string;
  fiatAmount: number;
  platformFee: number;
  loading: boolean;
  error: string | null;
}

/**
 * Component to render calculated trade values
 */
export const TradeCalculatedValues: React.FC<TradeCalculatedValuesProps> = ({
  offer,
  amount,
  fiatAmount,
  platformFee,
  loading,
  error,
}) => {
  if (loading || error || fiatAmount <= 0) {
    return null;
  }

  const feeFlag = import.meta.env.VITE_FEE_FLAG === 'true';
  // Ensure platformFee is calculated based on the flag within calculateAmounts
  // showFee determines if *any* fee section (even informational) should be shown
  const showFeeSection = feeFlag; // Show fee section if flag is true, regardless of amount
  const actualFeeCharged = feeFlag && platformFee > 0; // Is a fee actually being calculated?
  const escrowAmount = amount
    ? parseFloat(amount) + (feeFlag && offer.offer_type === 'BUY' ? platformFee : 0)
    : 0;

  return (
    <div className="space-y-3 py-3 bg-neutral-100 rounded">
      <div className="font-medium text-neutral-700 border-b pb-1 mb-2">Details</div>
      {offer.offer_type === 'BUY' ? (
        // Selling USDC (User is the Seller)
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-700">You are selling</span>
            <span className="font-medium">{amount && formatNumber(parseFloat(amount))} USDC</span>
          </div>

          {showFeeSection && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-700">YapBay Fee (1%)</span>
                <span className="font-medium">{formatNumber(platformFee)} USDC</span>
              </div>
              {actualFeeCharged && (
                <div className="text-xs text-neutral-500 pl-2">
                  <span>50% of this fee can go to the referral program</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-neutral-700">You will escrow</span>
            <span className="font-medium">
              {/* Escrow includes base amount + fee if applicable */}
              {formatNumber(escrowAmount)} USDC
            </span>
          </div>

          <div className="pt-2 mt-2 flex justify-between items-center bg-amber-100 rounded p-2">
            <span className="font-medium text-neutral-700">You will receive</span>
            <span className="font-bold text-primary-800">
              {formatNumber(fiatAmount)} {offer.fiat_currency}
            </span>
          </div>
        </>
      ) : (
        // Buying USDC (User is the Buyer)
        <>
          <div className="flex justify-between items-center bg-amber-100 rounded p-2">
            <span className="text-sm text-neutral-700">You will pay</span>
            <span className="font-medium">
              {formatNumber(fiatAmount)} {offer.fiat_currency}
            </span>
          </div>

          {showFeeSection && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-700">YapBay Fee</span>
                {/* Buyer pays 0 fiat fee */}
                <span className="font-medium">0 {offer.fiat_currency}</span>
              </div>
              <div className="text-xs text-neutral-500 pl-2">
                {/* Show the fee the seller pays */}
                <span>Seller pays the 1% YapBay fee ({formatNumber(platformFee)} USDC)</span>
              </div>
            </>
          )}
          {!feeFlag && (
            <div className="text-xs text-neutral-500 pl-2 pt-1">
              <span>No platform fee is currently charged for this trade.</span>
            </div>
          )}

          <div className="border-t pt-2 mt-2 flex justify-between items-center">
            <span className="font-medium text-neutral-700">You will receive</span>
            <span className="font-bold text-primary-800">
              {/* Buyer receives the base amount */}
              {amount && formatNumber(parseFloat(amount))} USDC
            </span>
          </div>
        </>
      )}
    </div>
  );
};
