import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createOffer, getAccount, Account, Offer } from "./api";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CurrencyOptions } from "./lib/currencyOptions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Container from "./components/Container";

interface CreateOfferPageProps {
  account: Account | null;
}

function CreateOfferPage({ account: propAccount }: CreateOfferPageProps) {
  const [internalAccount, setInternalAccount] = useState<Account | null>(null);
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    const fetchAccount = async () => {
      if (!propAccount && primaryWallet) {
        try {
          const response = await getAccount();
          setInternalAccount(response.data);
          setFormData(prev => ({
            ...prev,
            creator_account_id: response.data.id.toString()
          }));
        } catch (err) {
          console.error("Failed to fetch account:", err);
        }
      }
    };
    fetchAccount();
  }, [propAccount, primaryWallet]);

  const account = propAccount || internalAccount;
  const [formData, setFormData] = useState({
    creator_account_id: account?.id || "",
    offer_type: "BUY" as "BUY" | "SELL",
    token: "USDC",
    min_amount: "",
    max_amount: "",
    total_available_amount: "",
    rate_adjustment: "1.05",
    terms: "Cash only",
    escrow_deposit_time_limit: "15 minutes",
    fiat_payment_time_limit: "30 minutes",
    fiat_currency: "USD",
  });
  const [success, setSuccess] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Ensure account ID is a number
    let accountId: number;
    if (typeof account?.id === 'string') {
      accountId = parseInt(account.id, 10);
    } else {
      accountId = account?.id as number;
    }

    // Basic validation
    if (!accountId) {
      setError("Account ID is required");
      return;
    }

    const minAmount = Number(formData.min_amount);
    const maxAmount = Number(formData.max_amount);
    const totalAmount = Number(formData.total_available_amount);

    if (minAmount <= 0) {
      setError("Minimum amount must be greater than 0");
      return;
    }

    if (maxAmount < minAmount) {
      setError("Maximum amount must be greater than or equal to minimum amount");
      return;
    }

    if (totalAmount < maxAmount) {
      setError("Total available amount must be at least as large as maximum amount");
      return;
    }

    try {
      // Prepare offer data with proper numeric types
      const data: Partial<Offer> = {
        creator_account_id: accountId,
        offer_type: formData.offer_type,
        token: formData.token,
        min_amount: minAmount,
        max_amount: maxAmount,
        total_available_amount: totalAmount,
        rate_adjustment: Number(formData.rate_adjustment),
        terms: formData.terms,
        escrow_deposit_time_limit: { minutes: 15 },
        fiat_payment_time_limit: { minutes: 30 },
        fiat_currency: formData.fiat_currency
      };

      const response = await createOffer(data);
      setSuccess(`Offer created successfully with ID: ${response.data.id}.`);

      // Reset form
      setFormData({
        creator_account_id: account?.id?.toString() || "",
        offer_type: "BUY",
        token: "USDC",
        min_amount: "",
        max_amount: "",
        total_available_amount: "",
        rate_adjustment: "1.05",
        terms: "Cash only",
        escrow_deposit_time_limit: "15 minutes",
        fiat_payment_time_limit: "30 minutes",
        fiat_currency: "USD",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
      console.error("Create offer error:", err);
    }
  };

  if (!primaryWallet) {
    return (
      <Container className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#5b21b6] font-semibold">Create an Offer</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>Please connect your wallet to create an offer.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#5b21b6] font-semibold">Create an Offer</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {success && (
            <Alert className="mb-6 bg-[#d1fae5] border-[#a7f3d0]">
              <AlertDescription className="text-[#065f46]">
                <span>
                  {success} <Link
                    to="/offers"
                    className="inline underline text-[#5b21b6] hover:text-[#7c3aed]"
                    style={{ display: 'inline !important' }}
                  >
                    View your offers
                  </Link> to see and edit your offer.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200" variant="destructive">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="creator_account_id"
                className="block text-sm font-medium text-neutral-700"
              >
                Your Account ID
              </label>
              <Input
                id="creator_account_id"
                type="text"
                value={formData.creator_account_id}
                className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                onChange={(e) => setFormData({ ...formData, creator_account_id: e.target.value })}
                disabled
              />
              <p className="text-xs text-neutral-500">This is your account identifier</p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="offer_type"
                className="block text-sm font-medium text-neutral-700"
              >
                Offer Type
              </label>
              <Select
                value={formData.offer_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, offer_type: value as "BUY" | "SELL" })
                }
              >
                <SelectTrigger className="border-neutral-300 focus:ring-[#8b5cf6]">
                  <SelectValue placeholder="Select offer type" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-100">
                  <SelectItem value="BUY">Buy USDC</SelectItem>
                  <SelectItem value="SELL">Sell USDC</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">
                {formData.offer_type === "BUY"
                  ? "You want to buy USDC with fiat currency"
                  : "You want to sell USDC for fiat currency"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="min_amount"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Minimum Amount (USDC)
                </label>
                <Input
                  id="min_amount"
                  type="number"
                  placeholder="10"
                  className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="max_amount"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Maximum Amount (USDC)
                </label>
                <Input
                  id="max_amount"
                  type="number"
                  placeholder="100"
                  className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  value={formData.max_amount}
                  onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="total_available_amount"
                className="block text-sm font-medium text-neutral-700"
              >
                Total Available Amount (USDC)
              </label>
              <Input
                id="total_available_amount"
                type="number"
                placeholder="1000"
                className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                value={formData.total_available_amount}
                onChange={(e) => setFormData({ ...formData, total_available_amount: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                Total amount of USDC available for all trades from this offer
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="fiat_currency"
                className="block text-sm font-medium text-neutral-700"
              >
                Fiat Currency
              </label>
              <Select
                value={formData.fiat_currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, fiat_currency: value })
                }
              >
                <SelectTrigger className="border-neutral-300 focus:ring-[#8b5cf6]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-100">
                  <CurrencyOptions />
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">
                Currency you want to trade in
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="rate_adjustment"
                className="block text-sm font-medium text-neutral-700"
              >
                Rate Adjustment
              </label>
              <Input
                id="rate_adjustment"
                type="number"
                step="0.01"
                className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                value={formData.rate_adjustment}
                onChange={(e) => setFormData({ ...formData, rate_adjustment: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                1.05 = +5% above market rate, 0.95 = -5% below market rate
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="terms"
                className="block text-sm font-medium text-neutral-700"
              >
                Terms
              </label>
              <Input
                id="terms"
                type="text"
                className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              />
              <p className="text-xs text-neutral-500">
                Additional terms or payment methods you accept
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="escrow_deposit_time_limit"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Escrow Deposit Time Limit
                </label>
                <Input
                  id="escrow_deposit_time_limit"
                  type="text"
                  className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  value={formData.escrow_deposit_time_limit}
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="fiat_payment_time_limit"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Fiat Payment Time Limit
                </label>
                <Input
                  id="fiat_payment_time_limit"
                  type="text"
                  className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
                  value={formData.fiat_payment_time_limit}
                  disabled
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white mt-6"
            >
              Create Offer
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default CreateOfferPage;
