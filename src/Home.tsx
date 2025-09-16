import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Link, useNavigate } from 'react-router-dom';
import { getOffers, Offer } from './api'; // Removed deleteOffer import

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import FilterBar from '@/components/Home/FilterBar';
import IntroMessageNotLoggedIn from '@/components/Home/IntroMessageNotLoggedIn';
import NoOffers from '@/components/Home/NoOffers';

// Custom Components
import MobileOfferList from './components/Home/MobileOfferList';
import DesktopOfferTable from './components/Home/DesktopOfferTable';
import OfferPagination from './components/Home/OfferPagination';

// Custom Hooks
import { useOfferFiltering } from './hooks/useOfferFiltering';
import { useUserAccount, fetchCreatorNames } from './hooks/useUserAccount';
import { useOfferDeletion } from './hooks/useOfferDeletion'; // Import the hook

// Services
import { startTrade } from './services/tradeService';

function HomePage() {
  const { primaryWallet } = useDynamicContext();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Custom hooks
  const { hasUsername, currentUserAccountId, creatorNames, setCreatorNames } =
    useUserAccount(primaryWallet);
  const {
    filteredOffers,
    currentPage,
    totalPages,
    handleCurrencyChange,
    handleTradeTypeChange,
    handlePageChange,
  } = useOfferFiltering({
    offers,
    itemsPerPage: 25,
  });

  // Setup offer deletion hook
  const { handleDeleteOffer: performDelete, isDeleting: isDeletingOffer } = useOfferDeletion({
    setOffersState: setOffers,
    onSuccess: message => {
      setDeleteSuccess(message);
      // Clear success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    },
    onError: message => {
      setError(message);
    },
  });

  // Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await getOffers();

        // Handle the new API response structure: {network: string, offers: Offer[]}
        const offersData = response.data.offers || [];

        // Validate that offers is an array before sorting
        if (!Array.isArray(offersData)) {
          console.error('[HomePage] Invalid offers data structure:', offersData);
          setError('Invalid response format from server');
          setOffers([]);
          return;
        }

        const sortedOffers = offersData.sort(
          (a: Offer, b: Offer) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setOffers(sortedOffers);

        // Fetch creator names
        await fetchCreatorNames(sortedOffers, primaryWallet, setCreatorNames);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[HomePage] Fetch failed:', err);
        setError(`Failed to load offers: ${errorMessage}`);
        setOffers([]); // Ensure offers is set to empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [primaryWallet, setCreatorNames]);

  // Removed old handleDeleteOffer function

  // Open trade dialog
  const openTradeDialog = (offerId: number) => {
    setSelectedOfferId(offerId);
    setIsDialogOpen(true);
  };

  // Handle trade confirmation
  const handleConfirmTrade = (offerId: number, amount: string, fiatAmount: number) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    startTrade({
      offerId,
      amount,
      fiatAmount,
      offer,
      primaryWallet,
      onSuccess: tradeId => {
        setIsDialogOpen(false);
        navigate(`/trade/${tradeId}`);
      },
      onError: error => {
        alert('Trade failed: ' + error.message);
      },
    });
  };

  return (
    <TooltipProvider>
      <div className="w-full">
        {!primaryWallet && <IntroMessageNotLoggedIn />}
        <Card>
          {hasUsername === false && primaryWallet && (
            <div>
              <Alert className="mb-0 border-yellow-300 bg-yellow-50">
                <AlertDescription className="text-primary-700">
                  <span>
                    You haven't set a username yet.{' '}
                    <Link to="/account" className="underline font-medium">
                      Click here
                    </Link>{' '}
                    to create your profile.
                  </span>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-primary font-semibold">Available Offers</CardTitle>
                <CardDescription>
                  Start a simple P2P trade from one of the available offers
                </CardDescription>
              </div>
              {primaryWallet && (
                <Button className="bg-primary-800 hover:bg-primary-300 w-full sm:w-auto">
                  <Link to="/create-offer" className="w-full">
                    <span className="text-neutral-100">Create New Offer</span>
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              <FilterBar
                onCurrencyChange={handleCurrencyChange}
                onTradeTypeChange={handleTradeTypeChange}
              />
            </div>

            {loading && (
              <div className="flex justify-center items-center py-16">
                <p className="text-neutral-500">Loading available offers...</p>
              </div>
            )}

            {error && (
              <div className="p-5">
                <Alert variant="destructive" className="mb-0 border-none bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {deleteSuccess && (
              <div className="p-5">
                <Alert className="mb-0 bg-warning border-warning">
                  <AlertDescription className="text-neutral-100">{deleteSuccess}</AlertDescription>
                </Alert>
              </div>
            )}

            {!loading && !error && offers.length === 0 ? (
              <NoOffers />
            ) : (
              !loading &&
              !error && (
                <>
                  {/* Mobile view */}
                  <MobileOfferList
                    filteredOffers={filteredOffers}
                    creatorNames={creatorNames}
                    currentUserAccountId={currentUserAccountId}
                    primaryWallet={primaryWallet}
                    isDialogOpen={isDialogOpen}
                    selectedOfferId={selectedOfferId}
                    handleDeleteOffer={performDelete} // Use hook's delete function
                    isDeletingOffer={isDeletingOffer} // Pass deleting state
                    openTradeDialog={openTradeDialog}
                    onOpenChange={open => !open && setIsDialogOpen(false)}
                    onConfirmTrade={handleConfirmTrade}
                  />

                  {/* Desktop view */}
                  <DesktopOfferTable
                    filteredOffers={filteredOffers}
                    creatorNames={creatorNames}
                    currentUserAccountId={currentUserAccountId}
                    primaryWallet={primaryWallet}
                    isDialogOpen={isDialogOpen}
                    selectedOfferId={selectedOfferId}
                    handleDeleteOffer={performDelete} // Use hook's delete function
                    isDeletingOffer={isDeletingOffer} // Pass deleting state
                    openTradeDialog={openTradeDialog}
                    onOpenChange={open => !open && setIsDialogOpen(false)}
                    onConfirmTrade={handleConfirmTrade}
                  />
                </>
              )
            )}

            {/* Pagination */}
            {!loading && !error && filteredOffers.length > 0 && (
              <OfferPagination
                currentPage={currentPage}
                totalPages={totalPages}
                handlePageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export default HomePage;
