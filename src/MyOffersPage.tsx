import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Link } from "react-router-dom";
import { getOffers, deleteOffer, Offer, Account } from "./api";
import { formatNumber } from "./lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import Container from "./components/Container";
import OfferTypeTooltip from "./components/OfferTypeTooltip";
import OfferActionButtons from "./components/OfferActionButtons";

interface MyOffersPageProps {
  account: Account | null;
}

function MyOffersPage({ account }: MyOffersPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyOffers = async () => {
      if (!account) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get all offers and filter by the current user's account ID
        const response = await getOffers();
        const userOffers = response.data
          .filter((offer: Offer) => offer.creator_account_id === account.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMyOffers(userOffers);
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("[MyOffersPage] Fetch failed:", err);
        setError(`Failed to load your offers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOffers();
  }, [account]);

  const handleDeleteOffer = async (offerId: number) => {
    try {
      await deleteOffer(offerId);
      setMyOffers(myOffers.filter((offer) => offer.id !== offerId));
      setDeleteSuccess("Offer deleted successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to delete offer: ${errorMessage}`);
    }
  };

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };
if (!primaryWallet) {
  return (
    <TooltipProvider>
      <Container>
        <Card>
          <CardHeader className="border-b border-neutral-100">
            <CardTitle className="text-[#5b21b6] font-semibold">
              My Offers
            </CardTitle>
            <CardDescription>Manage your active offers</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>
                Please connect your wallet to view your offers.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        </Container>
      </TooltipProvider>
    );
  }

  if (!account) {
    return (
      <TooltipProvider>
        <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-[#5b21b6] font-semibold">
              My Offers
            </CardTitle>
            <CardDescription>Manage your active offers</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-700">
                Please create an account first to manage your offers.
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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">
                My Offers
              </CardTitle>
              <CardDescription>Manage your active offers</CardDescription>
            </div>
            <Button className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white w-full sm:w-auto">
              <Link to="/create-offer" className="text-white hover:text-white w-full">
                Create New Offer
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-5">
              <Alert
                variant="destructive"
                className="mb-0 border-none bg-red-50"
              >
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {deleteSuccess && (
            <div className="p-5">
              <Alert className="mb-0 bg-[#d1fae5] border-[#a7f3d0]">
                <AlertDescription className="text-[#065f46]">
                  {deleteSuccess}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading your offers...</p>
            </div>
          )}

          {!loading && myOffers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-neutral-500">
                You haven't created any offers yet.
              </p>
              <p className="text-neutral-400 text-sm mt-2">
                Create your first offer to start trading on LocalSolana.
              </p>
            </div>
          ) : (
            !loading && (
              <>
                {/* Mobile card view */}
                <div className="md:hidden p-4 space-y-4">
                  {myOffers.map((offer) => (
                    <div key={offer.id} className="mobile-card-view">
                      <div className="mobile-card-view-header">
                        <span>{formatNumber(offer.id)}</span>
                        <OfferTypeTooltip offerType={offer.offer_type} />
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Token</span>
                        <span>{offer.token}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Amount Range</span>
                        <span>{formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Available</span>
                        <span>{formatNumber(offer.total_available_amount)}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Rate</span>
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

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Currency</span>
                        <span>{offer.fiat_currency}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Created</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(offer.created_at))} ago
                        </span>
                      </div>

                      <OfferActionButtons
                        offerId={offer.id}
                        onDelete={handleDeleteOffer}
                        isMobile={true}
                      />
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        <TableHead className="text-[#6d28d9] font-medium">
                          ID
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Type
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Token
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Min Amount
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Max Amount
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Total Available
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Rate
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Currency
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Created
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOffers.map((offer) => (
                        <TableRow key={offer.id} className="hover:bg-neutral-50">
                          <TableCell>{formatNumber(offer.id)}</TableCell>
                          <TableCell>
                            <OfferTypeTooltip offerType={offer.offer_type} />
                          </TableCell>
                          <TableCell>{offer.token}</TableCell>
                          <TableCell>{formatNumber(offer.min_amount)}</TableCell>
                          <TableCell>{formatNumber(offer.max_amount)}</TableCell>
                          <TableCell>{formatNumber(offer.total_available_amount)}</TableCell>
                          <TableCell>
                            <span
                              className={
                                offer.rate_adjustment > 1
                                  ? "text-[#059669]"
                                  : offer.rate_adjustment < 1
                                  ? "text-red-600"
                                  : "text-neutral-600"
                              }
                            >
                              {formatRate(offer.rate_adjustment)}
                            </span>
                          </TableCell>
                          <TableCell>{offer.fiat_currency}</TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                            {formatDistanceToNow(new Date(offer.created_at))} ago
                          </TableCell>
                          <TableCell>
                            <OfferActionButtons
                              offerId={offer.id}
                              onDelete={handleDeleteOffer}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>
    </Container>
  </TooltipProvider>
  );
}

export default MyOffersPage;
