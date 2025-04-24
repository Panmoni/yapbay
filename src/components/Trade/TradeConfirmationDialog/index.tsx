import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';

// Import our custom hooks and components
import { useTradeConfirmation } from './useTradeConfirmation';
import { TradeCalculatedValues } from './TradeCalculatedValues';

interface TradeConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onConfirm: (leg1_offer_id: number, leg1_crypto_amount: string, leg1_fiat_amount: number) => void; // Updated parameter names
  triggerButton?: React.ReactNode;
}

const TradeConfirmationDialog = ({
  isOpen,
  onOpenChange,
  offer,
  onConfirm,
  triggerButton,
}: TradeConfirmationDialogProps) => {
  // Use our custom hook that combines all the logic
  const {
    amount,
    amountError,
    priceData,
    loading,
    error,
    fiatAmount,
    platformFee,
    handleAmountChange,
    handleConfirm,
  } = useTradeConfirmation(isOpen, offer, onConfirm);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="bg-neutral-100 z-50 max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Confirm Trade Details</DialogTitle>
          <DialogDescription>Review the details of this trade before confirming.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 mb-4 mt-2">
          {/* Trade Type */}
          <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
            <span className="font-medium text-neutral-700">Trade Type</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                offer.offer_type === 'BUY'
                  ? 'bg-secondary-200 text-secondary-900'
                  : 'bg-primary-100 text-primary-800'
              }`}
            >
              {offer.offer_type === 'BUY' ? 'You are selling USDC' : 'You are buying USDC'}
            </span>
          </div>

          {/* Token */}
          <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
            <span className="font-medium text-neutral-700">Token</span>
            <span>{offer.token}</span>
          </div>

          {/* Market Price */}
          {priceData && (
            <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
              <span className="font-medium text-neutral-700">Current Market Price</span>
              <span>
                {formatNumber(
                  parseFloat(
                    priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]
                      ?.price || '0'
                  )
                )}{' '}
                {offer.fiat_currency}
              </span>
            </div>
          )}

          {/* Rate */}
          <div className="flex flex-col p-2 bg-neutral-100 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium text-neutral-700">Rate Adjustment</span>
              <span
                className={
                  offer.rate_adjustment > 1
                    ? 'text-green-600'
                    : offer.rate_adjustment < 1
                    ? 'text-red-600'
                    : 'text-neutral-600'
                }
              >
                {offer.rate_adjustment > 1
                  ? `+${((offer.rate_adjustment - 1) * 100).toFixed(2)}%`
                  : offer.rate_adjustment < 1
                  ? `-${((1 - offer.rate_adjustment) * 100).toFixed(2)}%`
                  : '0%'}
              </span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {offer.offer_type === 'BUY'
                ? `You are selling USDC at ${
                    offer.rate_adjustment > 1
                      ? `${((offer.rate_adjustment - 1) * 100).toFixed(2)}% above`
                      : offer.rate_adjustment < 1
                      ? `${((1 - offer.rate_adjustment) * 100).toFixed(2)}% below`
                      : `the same as`
                  } the market price.`
                : `You are buying USDC at ${
                    offer.rate_adjustment > 1
                      ? `${((offer.rate_adjustment - 1) * 100).toFixed(2)}% above`
                      : offer.rate_adjustment < 1
                      ? `${((1 - offer.rate_adjustment) * 100).toFixed(2)}% below`
                      : `the same as`
                  } the market price.`}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({offer.token})</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="amount"
                type="text" // Changed from "number" to "text" for better decimal control
                inputMode="decimal" // Brings up numeric keyboard on mobile with decimal point
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter amount (${offer.min_amount} - ${offer.max_amount})`}
                className={`bg-neutral-100 ${
                  amountError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                readOnly={false}
                autoFocus
                min={offer.min_amount}
                max={offer.max_amount}
                step="0.01" // Allow increments of 0.01
              />
              <span className="text-sm text-neutral-500">{offer.token}</span>
            </div>
            <div className="text-xs text-neutral-500">
              Available: {formatNumber(offer.total_available_amount)} {offer.token} | Min:{' '}
              {formatNumber(offer.min_amount)} | Max: {formatNumber(offer.max_amount)}
            </div>
            {amountError && <div className="text-xs text-red-600 mt-1">{amountError}</div>}
          </div>

          {/* Use our TradeCalculatedValues component */}
          <TradeCalculatedValues
            offer={offer}
            amount={amount}
            fiatAmount={fiatAmount}
            platformFee={platformFee}
            loading={loading}
            error={error}
          />

          {/* Time Limits */}
          <div className="text-xs text-neutral-500 p-2 bg-neutral-100 rounded">
            <p>
              Escrow Deposit Time Limit:{' '}
              {typeof offer.escrow_deposit_time_limit === 'string'
                ? offer.escrow_deposit_time_limit
                : `${offer.escrow_deposit_time_limit.minutes} minutes`}
            </p>
            <p className="mt-1">
              Fiat Payment Time Limit:{' '}
              {typeof offer.fiat_payment_time_limit === 'string'
                ? offer.fiat_payment_time_limit
                : `${offer.fiat_payment_time_limit.minutes} minutes`}
            </p>
          </div>

          {/* Error Message */}
          {error && <div className="p-2 text-sm text-red-600 bg-red-50 rounded">{error}</div>}

          {/* Loading Message */}
          {loading && (
            <div className="p-2 text-sm text-neutral-600 bg-neutral-50 rounded">
              Loading price data...
            </div>
          )}

          {/* Next Steps Note */}
          {!loading && !error && fiatAmount > 0 && (
            <div className="p-3 bg-primary-100 text-primary-800 rounded text-sm">
              {offer.offer_type === 'BUY' ? (
                <p>
                  <strong>Note:</strong> As the seller, you will be prompted to create the on-chain
                  escrow account and to pay for it in CELO.
                </p>
              ) : (
                <p>
                  <strong>Note:</strong> As the buyer, you will wait for the seller to escrow the
                  crypto. Later, you will be prompted to make the fiat payment, and then confirm
                  that via an on-chain action.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-secondary-500 hover:bg-secondary-600 text-white"
            onClick={handleConfirm}
            disabled={loading || !!error || !!amountError || fiatAmount <= 0}
          >
            Initiate Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradeConfirmationDialog;
