import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Offer, getPrices, PricesResponse } from "../api";
import { formatNumber } from "../lib/utils";

interface TradeConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onConfirm: (offerId: number, amount: string, fiatAmount: number) => void;
  triggerButton?: React.ReactNode;
}

const TradeConfirmationDialog = ({
  isOpen,
  onOpenChange,
  offer,
  onConfirm,
  triggerButton,
}: TradeConfirmationDialogProps) => {
  const [amount, setAmount] = useState<string>("");
  const [priceData, setPriceData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);

  // Define calculateAmounts first so it can be used in useEffects
  const calculateAmounts = useCallback(() => {
    if (!priceData || !amount) return;

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setFiatAmount(0);
        setPlatformFee(0);
        return;
      }

      // Get base price for the token in the offer's currency
      const basePrice = priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]?.price;
      if (!basePrice) {
        setError(`Price data not available for ${offer.fiat_currency}`);
        return;
      }

      // Apply rate adjustment from the offer
      const adjustedPrice = parseFloat(basePrice) * offer.rate_adjustment;

      // Calculate fiat amount
      const calculatedFiatAmount = numAmount * adjustedPrice;

      // Calculate platform fee differently based on offer type
      let calculatedPlatformFee;

      if (offer.offer_type === "SELL") {
        // When buying USDC (offer type is SELL), the seller pays the fee in USDC
        // The buyer (user) just pays the fiat amount
        calculatedPlatformFee = calculatedFiatAmount * 0.01; // 1% of fiat amount (shown for information only)
      } else {
        // When selling USDC (offer type is BUY), the user pays the fee in USDC
        calculatedPlatformFee = numAmount * 0.01; // 1% of USDC amount
      }

      setFiatAmount(calculatedFiatAmount);
      setPlatformFee(calculatedPlatformFee);
    } catch (error) {
      console.error("Error calculating amounts:", error);
      setError("Error calculating trade amounts. Please try again.");
    }
  }, [amount, priceData, offer.fiat_currency, offer.rate_adjustment, offer.offer_type]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching price data...");
      const response = await getPrices();
      console.log("Price data response:", response);

      // Check if we have valid data
      if (response && response.data && response.data.data && response.data.data.USDC) {
        console.log("Setting price data:", response.data);
        setPriceData(response.data);

        // Immediately calculate amounts with the new price data
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
          calculateAmounts();
        }
      } else {
        console.error("Invalid price data format:", response);
        setError("Received invalid price data format. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch price data:", err);
      setError("Failed to fetch current market prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch price data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPriceData();
    }
    // We only want to fetch price data when the dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Only reset the form values, not the price data
      setAmount("");
      setFiatAmount(0);
      setPlatformFee(0);
      setError(null);
      setAmountError(null);
    }
    // Note: We don't set the amount here anymore
  }, [isOpen]);

  // Calculate fiat amount when amount or price data changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateAmounts();
    }
  }, [amount, priceData, calculateAmounts]);

  // Set a default amount when the dialog opens
  useEffect(() => {
    if (isOpen && offer && offer.min_amount) {
      setAmount(offer.min_amount.toString());

      // If we already have price data, calculate amounts
      if (priceData) {
        calculateAmounts();
      }
    }
    // Intentionally excluding priceData and calculateAmounts to prevent
    // the amount from being reset when price data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, offer]); // Only run when dialog opens or offer changes

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input for user to clear and type a new value
    if (value === "") {
      setAmount(value);
      setAmountError(null);
      return;
    }

    // Validate that input is a number with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      return;
    }

    // Update the amount state
    setAmount(value);

    // Validate against min/max/total limits
    const numAmount = parseFloat(value);
    if (!isNaN(numAmount)) {
      if (numAmount < offer.min_amount) {
        setAmountError(`Amount must be at least ${formatNumber(offer.min_amount)} ${offer.token}`);
      } else if (numAmount > offer.max_amount) {
        setAmountError(`Amount cannot exceed ${formatNumber(offer.max_amount)} ${offer.token}`);
      } else if (numAmount > offer.total_available_amount) {
        setAmountError(`Amount exceeds available amount of ${formatNumber(offer.total_available_amount)} ${offer.token}`);
      } else {
        setAmountError(null);
      }
    }
  };

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const numAmount = parseFloat(amount);

    // Validate against min/max offer amounts
    if (numAmount < offer.min_amount) {
      setError(`Amount must be at least ${formatNumber(offer.min_amount)} ${offer.token}`);
      return;
    }

    if (numAmount > offer.max_amount) {
      setError(`Amount cannot exceed ${formatNumber(offer.max_amount)} ${offer.token}`);
      return;
    }

    if (numAmount > offer.total_available_amount) {
      setError(`Amount exceeds available amount of ${formatNumber(offer.total_available_amount)} ${offer.token}`);
      return;
    }

    // Pass the amount as a decimal string directly
    const formattedAmount = numAmount.toString();
    onConfirm(offer.id, formattedAmount, fiatAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="bg-neutral-100 z-50 max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Confirm Trade Details</DialogTitle>
          <DialogDescription>
            Review the details of this trade before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 mb-4 mt-2">
          {/* Trade Type */}
          <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
            <span className="font-medium text-neutral-700">Trade Type</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              offer.offer_type === 'BUY'
                ? 'bg-secondary-200 text-secondary-900'
                : 'bg-primary-100 text-primary-800'
            }`}>
              {offer.offer_type === 'BUY'
                ? 'You are selling USDC'
                : 'You are buying USDC'}
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
                {formatNumber(parseFloat(priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]?.price || "0"))} {offer.fiat_currency}
              </span>
            </div>
          )}

          {/* Rate */}
          <div className="flex flex-col p-2 bg-neutral-100 rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium text-neutral-700">Rate Adjustment</span>
              <span className={
                offer.rate_adjustment > 1
                  ? 'text-green-600'
                  : offer.rate_adjustment < 1
                    ? 'text-red-600'
                    : 'text-neutral-600'
              }>
                {offer.rate_adjustment > 1
                  ? `+${((offer.rate_adjustment - 1) * 100).toFixed(2)}%`
                  : offer.rate_adjustment < 1
                    ? `-${((1 - offer.rate_adjustment) * 100).toFixed(2)}%`
                    : "0%"}
              </span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {offer.offer_type === 'BUY'
                ? `You are selling USDC at ${offer.rate_adjustment > 1
                    ? `${((offer.rate_adjustment - 1) * 100).toFixed(2)}% above`
                    : offer.rate_adjustment < 1
                      ? `${((1 - offer.rate_adjustment) * 100).toFixed(2)}% below`
                      : `the same as`} the market price.`
                : `You are buying USDC at ${offer.rate_adjustment > 1
                    ? `${((offer.rate_adjustment - 1) * 100).toFixed(2)}% above`
                    : offer.rate_adjustment < 1
                      ? `${((1 - offer.rate_adjustment) * 100).toFixed(2)}% below`
                      : `the same as`} the market price.`
              }
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
                className={`bg-neutral-100 ${amountError ? 'border-red-500 focus:ring-red-500' : ''}`}
                readOnly={false}
                autoFocus
                min={offer.min_amount}
                max={offer.max_amount}
                step="0.01" // Allow increments of 0.01
              />
              <span className="text-sm text-neutral-500">{offer.token}</span>
            </div>
            <div className="text-xs text-neutral-500">
              Available: {formatNumber(offer.total_available_amount)} {offer.token} |
              Min: {formatNumber(offer.min_amount)} |
              Max: {formatNumber(offer.max_amount)}
            </div>
            {amountError && (
              <div className="text-xs text-red-600 mt-1">
                {amountError}
              </div>
            )}
          </div>

          {/* Calculated Values */}
          {/* Calculated Values */}
          {!loading && !error && fiatAmount > 0 && (
            <div className="space-y-3 py-3 bg-neutral-100 rounded">
              <div className="font-medium text-neutral-700 border-b pb-1 mb-2">
                Details
              </div>
              {(() => {
                const feeFlag = import.meta.env.VITE_FEE_FLAG === 'true';
                // Ensure platformFee is calculated based on the flag within calculateAmounts
                // showFee determines if *any* fee section (even informational) should be shown
                const showFeeSection = feeFlag; // Show fee section if flag is true, regardless of amount
                const actualFeeCharged = feeFlag && platformFee > 0; // Is a fee actually being calculated?
                const escrowAmount = amount ? parseFloat(amount) + (feeFlag && offer.offer_type === 'BUY' ? platformFee : 0) : 0;

                return offer.offer_type === "BUY" ? (
                  // Selling USDC (User is the Seller)
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-700">You are selling</span>
                      <span className="font-medium">
                        {amount && formatNumber(parseFloat(amount))} USDC
                      </span>
                    </div>

                    {showFeeSection && ( // Show fee info if flag is true
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-700">YapBay Fee (1%)</span>
                          <span className="font-medium">{formatNumber(platformFee)} USDC</span>
                        </div>
                        {actualFeeCharged && ( // Only show referral note if fee > 0
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
                      <span className="font-bold text-primary-800">{formatNumber(fiatAmount)} {offer.fiat_currency}</span>
                    </div>
                  </>
                ) : (
                  // Buying USDC (User is the Buyer)
                  <>
                    <div className="flex justify-between items-center bg-amber-100 rounded p-2">
                      <span className="text-sm text-neutral-700">You will pay</span>
                      <span className="font-medium">{formatNumber(fiatAmount)} {offer.fiat_currency}</span>
                    </div>

                    {showFeeSection && ( // Show fee info if flag is true
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
                    {!feeFlag && ( // Explicitly state no fee if flag is false
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
                );
              })()}
            </div>
          )}

          {/* Time Limits */}
          <div className="text-xs text-neutral-500 p-2 bg-neutral-100 rounded">
            <p>Escrow Deposit Time Limit: {
              typeof offer.escrow_deposit_time_limit === 'string'
                ? offer.escrow_deposit_time_limit
                : `${offer.escrow_deposit_time_limit.minutes} minutes`
            }</p>
            <p className="mt-1">Fiat Payment Time Limit: {
              typeof offer.fiat_payment_time_limit === 'string'
                ? offer.fiat_payment_time_limit
                : `${offer.fiat_payment_time_limit.minutes} minutes`
            }</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          {/* Loading Message */}
          {loading && (
            <div className="p-2 text-sm text-neutral-600 bg-neutral-50 rounded">
              Loading price data...
            </div>
          )}

          {/* Next Steps Note */}
          {!loading && !error && fiatAmount > 0 && (
            <div className="p-3 bg-primary-100 text-primary-800 rounded text-sm">
              {offer.offer_type === "BUY" ? (
                <p>
                  <strong>Note:</strong> As the seller, you will be prompted to create the on-chain escrow account and to pay for it in SOL.
                </p>
              ) : (
                <p>
                  <strong>Note:</strong> As the buyer, you will wait for the seller to escrow the crypto. Later, you will be prompted to make the fiat payment, and then confirm that via an on-chain action.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
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
