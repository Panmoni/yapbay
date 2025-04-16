import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOfferById, updateOffer, Offer } from "./api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Container from "./components/Container";
import OfferDescription from "./components/OfferDescription";

function EditOfferPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Offer>>({
    offer_type: "BUY",
    token: "USDC",
    min_amount: 0,
    max_amount: 0,
    total_available_amount: 0,
    rate_adjustment: 1,
    terms: "",
    escrow_deposit_time_limit: { minutes: 60 },
    fiat_payment_time_limit: { minutes: 60 },
    fiat_currency: "USD",
  });

  // Store the raw percentage input value separately to preserve user input exactly
  const [rateAdjustmentInput, setRateAdjustmentInput] = useState("0.00");

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await getOfferById(parseInt(id));
        const offerData = response.data;

        // Set form data from the fetched offer
        setFormData({
          offer_type: offerData.offer_type,
          token: offerData.token,
          min_amount: offerData.min_amount,
          max_amount: offerData.max_amount,
          total_available_amount: offerData.total_available_amount,
          rate_adjustment: offerData.rate_adjustment,
          terms: offerData.terms,
          escrow_deposit_time_limit: offerData.escrow_deposit_time_limit,
          fiat_payment_time_limit: offerData.fiat_payment_time_limit,
          fiat_currency: offerData.fiat_currency,
        });

        // Set the rate adjustment input value
        setRateAdjustmentInput(((offerData.rate_adjustment - 1) * 100).toFixed(2));

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[EditOfferPage] Fetch failed:", err);
        setError(`Failed to load offer: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "min_amount" || name === "max_amount" || name === "total_available_amount") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === "rate_adjustment") {
      // Store the exact input value
      setRateAdjustmentInput(value);

      // Convert percentage input to rate factor (e.g., 5% -> 1.05, -3% -> 0.97)
      const percentValue = parseFloat(value) || 0;
      const rateFactor = 1 + percentValue / 100;
      setFormData({ ...formData, [name]: rateFactor });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // These functions have been removed as the fields are now non-editable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      await updateOffer(parseInt(id), formData);
      setSuccess("Offer updated successfully");

      // Clear success message after 3 seconds and navigate back to offer detail
      setTimeout(() => {
        navigate(`/offer/${id}`, { state: { message: 'Offer updated successfully' } });
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to update offer: ${errorMessage}`);
      window.scrollTo(0, 0); // Scroll to top to show error
    }
  };

  // No longer needed as we're using direct input value

  if (loading) {
    return (
      <Container>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading offer details...</p>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">Edit Offer #{id}</CardTitle>
              <CardDescription>Update your offer details</CardDescription>
              {!loading && formData && (
                <div className="mt-4">
                  <OfferDescription offer={formData as Offer} />
                  <p className="text-xs text-neutral-500 mt-2">To change the offer type, token or fiat currency, please create a new offer.</p>
                </div>
              )}
            </div>
            <Link to={`/offer/${id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 border-none bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-[#d1fae5] border-[#a7f3d0]">
              <AlertDescription className="text-[#065f46]">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Offer Type
                  </label>
                  <Input
                    value={formData.offer_type === "BUY" ? "BUY (You want to buy crypto)" : "SELL (You want to sell crypto)"}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Offer type cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Token
                  </label>
                  <Input
                    value={formData.token}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Token cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Minimum Amount
                  </label>
                  <Input
                    type="number"
                    name="min_amount"
                    value={formData.min_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Maximum Amount
                  </label>
                  <Input
                    type="number"
                    name="max_amount"
                    value={formData.max_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Total Available Amount
                  </label>
                  <Input
                    type="number"
                    name="total_available_amount"
                    value={formData.total_available_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rate Adjustment (%)
                  </label>
                  <Input
                    type="number"
                    name="rate_adjustment"
                    value={rateAdjustmentInput}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Positive values are above market rate, negative values are below
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fiat Currency
                  </label>
                  <Input
                    value={formData.fiat_currency}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Fiat currency cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Escrow Deposit Time Limit (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.escrow_deposit_time_limit?.minutes || 60}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Escrow deposit time limit cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fiat Payment Time Limit (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.fiat_payment_time_limit?.minutes || 60}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Fiat payment time limit cannot be changed
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                rows={6}
                className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6d28d9] focus:border-transparent"
                placeholder="Specify your terms and conditions for this offer..."
              />
            </div>

            <CardFooter className="flex justify-end px-0 pt-4 pb-0">
              <Button
                type="submit"
                className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white"
              >
                Update Offer
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default EditOfferPage;
