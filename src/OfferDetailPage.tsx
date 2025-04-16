import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getOfferById, getAccountById, createTrade, deleteOffer, Offer, Account, getAccount } from "./api";
import { formatNumber } from "./lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import Container from "./components/Container";
import OfferTypeTooltip from "./components/OfferTypeTooltip";
import OfferDescription from "./components/OfferDescription";

function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { primaryWallet } = useDynamicContext();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<Account | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchOfferAndCreator = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch offer details
        const offerResponse = await getOfferById(parseInt(id));
        const offerData = offerResponse.data;
        setOffer(offerData);

        // Fetch creator details
        const creatorResponse = await getAccountById(offerData.creator_account_id);
        setCreator(creatorResponse.data);

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[OfferDetailPage] Fetch failed:", err);
        setError(`Failed to load offer details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferAndCreator();
  }, [id]);

  // Fetch current user account
  useEffect(() => {
    const fetchUserAccount = async () => {
      if (!primaryWallet) return;

      try {
        const response = await getAccount();
        setUserAccount(response.data);
      } catch (err) {
        console.error("[OfferDetailPage] Failed to fetch user account:", err);
      }
    };

    fetchUserAccount();
  }, [primaryWallet]);

  // Check if the current user is the owner of the offer
  const isOwner = userAccount && offer && userAccount.id === offer.creator_account_id;

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!offer) return;

    try {
      await deleteOffer(offer.id);
      setIsDeleteDialogOpen(false);
      navigate('/offers', { state: { message: 'Offer deleted successfully' } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to delete offer: ${errorMessage}`);
    }
  };

  const handleStartTrade = async () => {
    if (!offer || !primaryWallet) return;

    try {
      const tradeData = {
        leg1_offer_id: offer.id,
        leg1_crypto_amount: "1000000", // Using string as API expects
        from_fiat_currency: offer.fiat_currency,
        destination_fiat_currency: offer.fiat_currency,
      };

      await createTrade(tradeData);
      navigate('/my-trades', { state: { message: 'Trade started successfully' } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to start trade: ${errorMessage}`);
    }
  };

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };

  if (loading) {
    return (
      <TooltipProvider>
        <Container>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading offer details...</p>
            </div>
          </CardContent>
        </Card>
      </Container>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <TooltipProvider>
        <Container>
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-0 border-none bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
      </TooltipProvider>
    );
  }

  if (!offer || !creator) {
    return (
      <TooltipProvider>
        <Container>
        <Card>
          <CardContent className="p-6">
            <Alert className="mb-0 bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-700">
                Offer not found or has been deleted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Container>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">
                Offer #{formatNumber(offer.id)}
              </CardTitle>
              <CardDescription>
                Created {formatDistanceToNow(new Date(offer.created_at))} ago by {creator.username || creator.wallet_address} | Last updated {formatDistanceToNow(new Date(offer.updated_at))} ago
              </CardDescription>
              <div className="mt-4">
                <OfferDescription offer={offer} />
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/offers">
                <Button variant="outline">Back to Offers</Button>
              </Link>
              {isOwner && (
                <Link to={`/edit-offer/${offer.id}`}>
                  <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6]">
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Type</span>
                <OfferTypeTooltip offerType={offer.offer_type} />
              </div>

              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Token</span>
                <span>{offer.token}</span>
              </div>

              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Amount Range</span>
                <span>{formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}</span>
              </div>

              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Available Amount</span>
                <span>{formatNumber(offer.total_available_amount)} {offer.token}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Rate Adjustment</span>
                <span className={
                  offer.rate_adjustment > 1
                    ? 'text-[#059669]'
                    : offer.rate_adjustment < 1
                      ? 'text-red-600'
                      : 'text-neutral-600'
                }>
                  {formatRate(offer.rate_adjustment)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Fiat Currency</span>
                <span>{offer.fiat_currency}</span>
              </div>

              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Escrow Deposit Time Limit</span>
                <span>{formatNumber(offer.escrow_deposit_time_limit.minutes)} minutes</span>
              </div>

              <div className="flex justify-between items-center p-4">
                <span className="font-medium text-neutral-700">Fiat Payment Time Limit</span>
                <span>{formatNumber(offer.fiat_payment_time_limit.minutes)} minutes</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-neutral-700 mb-2">Terms and Conditions</h3>
            <div className="p-4 whitespace-pre-wrap">
              {offer.terms || "No terms specified"}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-end border-t border-neutral-100 p-6">
          {isOwner ? (
            <>
              <Link to={`/edit-offer/${offer.id}`}>
                <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] w-full sm:w-auto">
                  Edit Offer
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={openDeleteDialog}
                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 w-full sm:w-auto"
              >
                Delete Offer
              </Button>
            </>
          ) : (
            primaryWallet ? (
              <Button
                onClick={handleStartTrade}
                className="bg-[#10b981] hover:bg-[#059669] text-white w-full sm:w-auto"
              >
                Start Trade
              </Button>
            ) : (
              <Button
                className="bg-gray-400 hover:bg-gray-500 text-white w-full sm:w-auto cursor-not-allowed"
                disabled
              >
                Connect Wallet to Trade
              </Button>
            )
          )}
        </CardFooter>
      </Card>
    </Container>

    {/* Delete Confirmation Dialog */}
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="bg-neutral-100 z-999">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this offer? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}

export default OfferDetailPage;
