import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Link } from 'react-router-dom';
import { getOffers, Offer, Account } from '@/api'; // Removed deleteOffer import
import { formatNumber } from '@/lib/utils';
import { formatRate } from '@/utils/stringUtils';
import { useOfferDeletion } from '@/hooks/useOfferDeletion'; // Import the hook
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import Container from '@/components/Shared/Container';
import OfferTypeTooltip from '@/components/Offer/OfferTypeTooltip';
import OfferActionButtons from '@/components/Offer/OfferActionButtons';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MyOffersPageProps {
  account: Account | null;
}

function MyOffersPage({ account }: MyOffersPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<string>('ALL');
  const limit = 10; // Number of offers per page

  // Setup offer deletion hook
  const { handleDeleteOffer: performDelete, isDeleting: isDeletingOffer } = useOfferDeletion({
    setOffersState: setMyOffers,
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
        let userOffers = response.data.offers.filter(
          (offer: Offer) => offer.creator_account_id === account.id
        );

        // Apply offer type filter if not ALL
        if (filter !== 'ALL') {
          userOffers = userOffers.filter((offer: Offer) => offer.offer_type === filter);
        }

        // Sort by creation date
        userOffers = userOffers.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Set total count for pagination
        setTotalCount(userOffers.length);

        // Apply pagination to the sorted offers
        const paginatedOffers = userOffers.slice((page - 1) * limit, page * limit);
        setMyOffers(paginatedOffers);

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[MyOffersPage] Fetch failed:', err);
        setError(`Failed to load your offers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOffers();
  }, [account, page, limit, filter]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleNextPage = () => {
    if (page * limit < totalCount) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  // Removed old handleDeleteOffer function

  if (!primaryWallet) {
    return (
      <TooltipProvider>
        <Container>
          <Card>
            <CardHeader className="border-b border-neutral-100">
              <CardTitle className="text-primary-800 font-semibold">My Offers</CardTitle>
              <CardDescription>Manage your active offers</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="bg-neutral-50 border-neutral-200">
                <AlertDescription>Please connect your wallet to view your offers.</AlertDescription>
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
              <CardTitle className="text-primary-800 font-semibold">My Offers</CardTitle>
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
          <CardHeader className="border-b border-neutral-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-primary-800 font-semibold">My Offers</CardTitle>
                <CardDescription>Manage your active offers</CardDescription>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-[180px] border-neutral-300 focus:ring-primary-500">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-100">
                    <SelectItem value="ALL">All Offers</SelectItem>
                    <SelectItem value="BUY">Buy Offers</SelectItem>
                    <SelectItem value="SELL">Sell Offers</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-primary-800 hover:bg-primary-300 w-full sm:w-auto" asChild>
                  <Link to="/create-offer">
                    <span className="text-neutral-100">Create Offer</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <p className="text-neutral-500">Loading your offers...</p>
              </div>
            ) : error ? (
              <Alert className="bg-red-50 border-red-200 mb-4">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            ) : deleteSuccess ? (
              <Alert className="bg-green-50 border-green-200 mb-4">
                <AlertDescription className="text-green-700">{deleteSuccess}</AlertDescription>
              </Alert>
            ) : myOffers.length === 0 ? (
              <Alert className="">
                <AlertDescription>
                  You don't have any offers yet.{' '}
                  <Link to="/create-offer" className="text-primary-700 hover:text-primary-800">
                    Create your first offer
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="md:hidden space-y-4">
                  {myOffers.map(offer => (
                    <div
                      key={offer.id}
                      className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-medium">#{formatNumber(offer.id)}</div>
                        <OfferTypeTooltip offerType={offer.offer_type} />
                      </div>

                      <div className="space-y-2">
                        <div className="mobile-card-view-row">
                          <span className="mobile-card-view-label">Token</span>
                          <span>{offer.token}</span>
                        </div>

                        <div className="mobile-card-view-row">
                          <span className="mobile-card-view-label">Amount Range</span>
                          <span>
                            {formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)}
                          </span>
                        </div>

                        <div className="mobile-card-view-row">
                          <span className="mobile-card-view-label">Rate</span>
                          <span
                            className={
                              offer.rate_adjustment > 1
                                ? 'text-success-600'
                                : offer.rate_adjustment < 1
                                ? 'text-red-600'
                                : 'text-neutral-600'
                            }
                          >
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
                          onDelete={performDelete} // Use hook's delete function
                          isDeleting={isDeletingOffer} // Pass deleting state
                          isMobile={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-primary-700 font-medium">ID</TableHead>
                        <TableHead className="text-primary-700 font-medium">Type</TableHead>
                        <TableHead className="text-primary-700 font-medium">Token</TableHead>
                        <TableHead className="text-primary-700 font-medium">Min Amount</TableHead>
                        <TableHead className="text-primary-700 font-medium">Max Amount</TableHead>
                        <TableHead className="text-primary-700 font-medium">
                          Total Available
                        </TableHead>
                        <TableHead className="text-primary-700 font-medium">Rate</TableHead>
                        <TableHead className="text-primary-700 font-medium">Currency</TableHead>
                        <TableHead className="text-primary-700 font-medium">Created</TableHead>
                        <TableHead className="text-primary-700 font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myOffers.map(offer => (
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
                                  ? 'text-success-600'
                                  : offer.rate_adjustment < 1
                                  ? 'text-red-600'
                                  : 'text-neutral-600'
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
                              onDelete={performDelete} // Use hook's delete function
                              isDeleting={isDeletingOffer} // Pass deleting state
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={handlePrevPage}
                          className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.ceil(totalCount / limit) })
                        .map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={page === i + 1}
                              onClick={() => setPage(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))
                        .slice(
                          Math.max(0, page - 3),
                          Math.min(Math.ceil(totalCount / limit), page + 2)
                        )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={handleNextPage}
                          className={
                            page * limit >= totalCount ? 'pointer-events-none opacity-50' : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </TooltipProvider>
  );
}

export default MyOffersPage;
