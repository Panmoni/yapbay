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
import { ExternalLink } from 'lucide-react';

// Import our custom hooks and components
import { useTradeConfirmation } from './useTradeConfirmation';
import { TradeCalculatedValues } from './TradeCalculatedValues';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

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

  const { primaryWallet } = useDynamicContext();

  // Determine if the current user will be the seller in this trade
  // If offer_type is 'BUY', the counterparty (taker) is the seller
  // If offer_type is 'SELL', the counterparty (taker) is the buyer
  const isSeller = offer.offer_type === 'BUY' && primaryWallet?.address;
  const {
    balance: usdcBalance,
    loading: usdcLoading,
    error: usdcError,
  } = useSellerUsdcBalance(isSeller ? primaryWallet?.address : undefined, isOpen, amount);
  const amountToEscrow = parseFloat(amount);
  const usdcBalanceNum = usdcBalance !== null ? Number(usdcBalance) / 1e6 : null;
  const insufficient =
    isSeller &&
    usdcBalanceNum !== null &&
    !usdcLoading &&
    !usdcError &&
    amountToEscrow > 0 &&
    usdcBalanceNum < amountToEscrow;

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
              <span className="text-neutral-600 text-sm">{offer.token}</span>
            </div>
            <div className="flex flex-col gap-1">
              {/* Seller's USDC Balance, styled as requested */}
              {isSeller && (
                <span className="text-neutral-500 text-xs">
                  Your current balance:{' '}
                  {usdcLoading
                    ? 'Loading...'
                    : usdcError
                    ? `Error`
                    : usdcBalanceNum?.toLocaleString(undefined, { maximumFractionDigits: 6 }) ??
                      '—'}{' '}
                  {offer.token}
                </span>
              )}
              {amountError && <div className="text-xs text-red-600 mt-1">{amountError}</div>}
              {/* Insufficient warning */}
              {isSeller && insufficient && (
                <div className="mt-1 text-xs text-red-700 bg-red-100 border border-red-200 rounded p-2">
                  <b>Warning:</b> Your USDC balance is insufficient to fund this escrow. Please
                  deposit more USDC to your wallet before proceeding.
                </div>
              )}
            </div>
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
                  escrow account and to pay for it in CELO. Please ensure you have sufficient{' '}
                  <a
                    href="https://faucet.celo.org/alfajores"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    CELO
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    USDC
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  .
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={Boolean(loading || amountError || insufficient)}
            className="bg-secondary-500 hover:bg-secondary-600 text-white w-full"
          >
            Initiate Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function useSellerUsdcBalance(address: string | undefined, open: boolean, amount: string) {
  const [balance, setBalance] = React.useState<bigint | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!address || !open) {
      setBalance(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUsdcBalance(address)
      .then(bal => {
        if (!cancelled) setBalance(bal);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address, open, amount]);
  return { balance, loading, error };
}

import { getUsdcBalance } from '@/services/chainService';

export default TradeConfirmationDialog;
