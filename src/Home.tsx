import { useState, useEffect, useCallback } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Link, useNavigate } from "react-router-dom";
import {
  getOffers,
  createTrade,
  // createEscrow, // Will be used again when escrow creation is moved back from TradePage after MVP
  Offer,
  getAccountById,
  getAccount,
  deleteOffer
} from "./api";
import { formatNumber } from "./lib/utils";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import OfferActionButtons from "./components/OfferActionButtons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import TradeConfirmationDialog from "./components/TradeConfirmationDialog";
import { formatDistanceToNow } from "date-fns";
import FilterBar from "@/components/FilterBar";
import IntroMessageNotLoggedIn from "./components/IntroMessageNotLoggedIn";
import NoOffers from "./components/NoOffers";

function OffersPage() {
  const { primaryWallet } = useDynamicContext();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorNames, setCreatorNames] = useState<Record<number, string>>({});
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);
  const [tradeType, setTradeType] = useState<string>("ALL");
  const [currentCurrency, setCurrentCurrency] = useState<string>("ALL");
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<number | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 25; // Show 25 offers per page
  const [totalPages, setTotalPages] = useState<number>(1);

  // Function to apply all active filters - memoized to prevent unnecessary recreations
  const applyFilters = useCallback(() => {
    let filtered = [...offers];

    // Filter by trade type (BUY shows SELL offers, SELL shows BUY offers, ALL shows all)
    if (tradeType === "BUY") {
      filtered = filtered.filter(offer => offer.offer_type === "SELL");
    } else if (tradeType === "SELL") {
      filtered = filtered.filter(offer => offer.offer_type === "BUY");
    }
    // If tradeType is "ALL", no filtering is applied

    // Filter by currency
    if (currentCurrency !== 'ALL') {
      filtered = filtered.filter(offer => offer.fiat_currency === currentCurrency);
    }

    // Calculate total pages
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total);

    // Get current page's offers
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOffers = filtered.slice(startIndex, endIndex);

    setFilteredOffers(paginatedOffers);
  }, [offers, tradeType, currentCurrency, currentPage, itemsPerPage]);

  // Apply filters whenever offers, currency, or trade type changes
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCurrencyChange = (currency: string) => {
    setCurrentCurrency(currency);
    // Reset to first page when changing filters
    setCurrentPage(1);
    // The applyFilters function will use the updated currentCurrency in the next render
    applyFilters();
  };

  const handleTradeTypeChange = (type: string) => {
    setTradeType(type);
    // Reset to first page when changing filters
    setCurrentPage(1);
    // The applyFilters function will use the current tradeType and currentCurrency in the next render
    applyFilters();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // The applyFilters function will use the updated currentPage in the next render
    applyFilters();
  };

  const handleDeleteOffer = async (offerId: number) => {
    try {
      await deleteOffer(offerId);
      setOffers(offers.filter((offer) => offer.id !== offerId));
      setFilteredOffers(filteredOffers.filter((offer) => offer.id !== offerId));
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

  useEffect(() => {
    const checkUsername = async () => {
      if (primaryWallet) {
        try {
          console.log("[OffersPage] Checking if user has username...");
          const accountResponse = await getAccount();
          const hasUsername = !!accountResponse.data.username;
          console.log("[OffersPage] User has username:", hasUsername, "Username:", accountResponse.data.username);
          setHasUsername(hasUsername);

          // Store the current user's account ID
          if (accountResponse.data.id) {
            setCurrentUserAccountId(accountResponse.data.id);
          }
        } catch (err) {
          console.error("[OffersPage] Failed to fetch user account:", err);

          // Check if it's an Axios error with a 404 status
          const axiosError = err as { response?: { status: number } };
          const isNotFound = axiosError.response && axiosError.response.status === 404;
          console.log("[OffersPage] Is 404 error:", isNotFound);

          // Set hasUsername to false if it's a 404 error (no account exists)
          setHasUsername(isNotFound ? false : null);

          // Debug current state
          console.log("[OffersPage] Current state - primaryWallet:", !!primaryWallet, "hasUsername:", isNotFound ? false : null);
        }
      } else {
        console.log("[OffersPage] No wallet connected");
        setCurrentUserAccountId(null);
      }
    };
    checkUsername();
  }, [primaryWallet]);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await getOffers();
        setOffers(
          response.data.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        );

        // Fetch creator usernames/wallet addresses
        const uniqueCreatorIds = [...new Set(response.data.map((o: Offer) => o.creator_account_id))];
        const namePromises = uniqueCreatorIds.map(async (id: number) => {
          try {
            const accountResponse = await getAccountById(id);
            const account = accountResponse.data;
            return { id, username: account.username || account.wallet_address };
          } catch (err) {
            console.error(`Failed to fetch account ${id}:`, err);
            return { id, username: `User #${id}` };
          }
        });

        const names = await Promise.all(namePromises);
        setCreatorNames(Object.fromEntries(names.map(({ id, username }) => [id, username])));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[OffersPage] Fetch failed:", err);
        setError(`Failed to load offers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const openTradeDialog = (offerId: number) => {
    setSelectedOfferId(offerId);
    setIsDialogOpen(true);
  };

  const startTrade = async (offerId: number, amount: string = "1000000", fiatAmount: number = 0) => {
    try {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) {
        throw new Error("Offer not found");
      }

      const tradeData = {
        leg1_offer_id: offerId,
        leg1_crypto_amount: amount, // Now using the amount from the form
        leg1_fiat_amount: fiatAmount.toString(), // Add the fiat amount
        from_fiat_currency: offer.fiat_currency,
        destination_fiat_currency: offer.fiat_currency,
      };
      const tradeResponse = await createTrade(tradeData);
      const tradeId = tradeResponse.data.id;

      if (primaryWallet) {
        // MVP: Escrow creation moved to TradePage to happen manually by user action
        // const seller = primaryWallet.address;
        // const buyer = String(offer.creator_account_id); // Convert to string
        //
        // const escrowData = {
        //   trade_id: tradeId,
        //   escrow_id: Math.floor(Math.random() * 1000000),
        //   seller,
        //   buyer,
        //   amount: parseFloat(amount), // Convert string amount to float to preserve decimal places
        // };
        //
        // const escrowResponse = await createEscrow(escrowData);
        // console.log("[OffersPage] Escrow instruction generated:", escrowResponse.data);

        // Close dialog and navigate to trade page
        setIsDialogOpen(false);
        navigate(`/trade/${tradeId}`);
      } else {
        alert(`Trade ${formatNumber(tradeId)} started, but no wallet connected`);
      }
    } catch (err) {
      console.error("[OffersPage] Trade failed:", err);
      alert("Trade failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const abbreviateWallet = (address: string) => {
    return address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
  };

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };

  // Debug render values
  console.log("[OffersPage] Rendering with:", {
    hasUsername,
    hasPrimaryWallet: !!primaryWallet,
    showAlert: hasUsername === false && !!primaryWallet
  });

  return (
    <TooltipProvider>
      <div className="w-full">
        {!primaryWallet && <IntroMessageNotLoggedIn />}
        <Card>
        {hasUsername === false && primaryWallet && (
          <div>
            <Alert className="mb-0 border-yellow-300 bg-yellow-50">
              <AlertDescription className="text-primary-700">
                <span>You haven't set a username yet. <Link to="/account" className="underline font-medium">Click here</Link> to create your profile.</span>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">Available Offers</CardTitle>
              <CardDescription>Start a simple P2P trade from one of the available offers</CardDescription>
            </div>
            {primaryWallet && (
              <Button className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white w-full sm:w-auto">
                <Link to="/create-offer" className="text-white hover:text-white w-full">
                  Create New Offer
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
    <Alert className="mb-0 bg-[#d1fae5] border-[#a7f3d0]">
      <AlertDescription className="text-[#065f46]">
        {deleteSuccess}
      </AlertDescription>
    </Alert>
  </div>
)}

          {!loading && !error && filteredOffers.length === 0 ? (
            <NoOffers />
          ) : (
            !loading && (
              <>
                {/* Mobile card view */}
                <div className="md:hidden p-4 space-y-4">
                  {filteredOffers.map((offer) => (
                    <div key={offer.id} className="mobile-card-view">
                      <div className="mobile-card-view-header">
                        <span>{formatNumber(offer.id)}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.offer_type === 'BUY'
                                ? 'bg-[#d1fae5] text-[#065f46]'
                                : 'bg-[#ede9fe] text-[#5b21b6]'
                            }`}>
                              {offer.offer_type}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className={
                            offer.offer_type === 'BUY'
                              ? 'bg-[#d1fae5] text-[#065f46]'
                              : 'bg-[#ede9fe] text-[#5b21b6]'
                          }>
                            <p>
                              {offer.offer_type === 'BUY'
                                ? 'An offer to buy crypto from you'
                                : 'An offer to sell crypto to you'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Creator</span>
                        <span>{creatorNames[offer.creator_account_id] ||
                          abbreviateWallet(String(offer.creator_account_id))}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Amount</span>
                        <span>{formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Available</span>
                        <span>{formatNumber(offer.total_available_amount)} {offer.token}</span>
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
                        <span className="mobile-card-view-label">Updated</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(offer.updated_at))} ago
                        </span>
                      </div>

                      <div className="mt-4">
                        {primaryWallet ? (
                          currentUserAccountId === offer.creator_account_id ? (
                            <OfferActionButtons
                              offerId={offer.id}
                              onDelete={handleDeleteOffer}
                              isMobile={true}
                            />
                          ) : (
                            <TradeConfirmationDialog
                              isOpen={isDialogOpen && selectedOfferId === offer.id}
                              onOpenChange={(open) => !open && setIsDialogOpen(false)}
                              offer={offer}
                              onConfirm={startTrade}
                              triggerButton={
                                <Button
                                  onClick={() => openTradeDialog(offer.id)}
                                  className="bg-[#10b981] hover:bg-[#059669] text-white w-full flex justify-center"
                                >
                                  Preview Trade
                                </Button>
                              }
                            />
                          )
                        ) : (
                          <Button
                            className="bg-gray-400 hover:bg-gray-500 text-white w-full flex justify-center cursor-not-allowed"
                          >
                            Connect Wallet to Trade
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        <TableHead className="text-[#6d28d9] font-medium">ID</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Type</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Creator</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Min Amount</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Max Amount</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Available</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Rate</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Currency</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Updated</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOffers.map((offer) => (
                        <TableRow key={offer.id} className="hover:bg-neutral-50">
                          <TableCell>{formatNumber(offer.id)}</TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  offer.offer_type === 'BUY'
                                    ? 'bg-[#d1fae5] text-[#065f46]'
                                    : 'bg-[#ede9fe] text-[#5b21b6]'
                                }`}>
                                  {offer.offer_type}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className={
                                offer.offer_type === 'BUY'
                                  ? 'bg-[#d1fae5] text-[#065f46]'
                                  : 'bg-[#ede9fe] text-[#5b21b6]'
                              }>
                                <p>
                                  {offer.offer_type === 'BUY'
                                  ? 'An offer to buy crypto from you'
                                  : 'An offer to sell crypto to you'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {creatorNames[offer.creator_account_id] ||
                             abbreviateWallet(String(offer.creator_account_id))}
                          </TableCell>
                          <TableCell>{formatNumber(offer.min_amount)} {offer.token}</TableCell>
                          <TableCell>{formatNumber(offer.max_amount)} {offer.token}</TableCell>
                          <TableCell>{formatNumber(offer.total_available_amount)} {offer.token}</TableCell>
                          <TableCell>
                            <span className={
                              offer.rate_adjustment > 1
                                ? 'text-[#059669]'
                                : offer.rate_adjustment < 1
                                  ? 'text-red-600'
                                  : 'text-neutral-600'
                            }>
                              {formatRate(offer.rate_adjustment)}
                            </span>
                            </TableCell>
                            <TableCell>{offer.fiat_currency}</TableCell>
                            <TableCell className="text-neutral-500 text-sm">
                            {formatDistanceToNow(new Date(offer.updated_at))} ago
                          </TableCell>
                          <TableCell>
                            {primaryWallet ? (
                              currentUserAccountId === offer.creator_account_id ? (
                                <OfferActionButtons
                                  offerId={offer.id}
                                  onDelete={handleDeleteOffer}
                                />
                              ) : (
                                <TradeConfirmationDialog
                                  isOpen={isDialogOpen && selectedOfferId === offer.id}
                                  onOpenChange={(open) => !open && setIsDialogOpen(false)}
                                  offer={offer}
                                  onConfirm={startTrade}
                                  triggerButton={
                                    <Button
                                      onClick={() => openTradeDialog(offer.id)}
                                      className="bg-[#10b981] hover:bg-[#059669] text-white border-none h-8 px-2 w-full flex justify-center"
                                    >
                                      Preview Trade
                                    </Button>
                                  }
                                />
                              )
                            ) : (
                              <Button
                                className="bg-gray-400 hover:bg-gray-500 text-white border-none text-sm px-3 py-1 h-8 cursor-not-allowed"
                              >
                                Connect Wallet to Trade
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )
          )}

          {/* Pagination */}
          {!loading && !error && filteredOffers.length > 0 && (
            <div className="py-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  {/* Previous button */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                  )}

                  {/* First page */}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>

                  {/* Ellipsis if needed */}
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Pages around current page */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNumber = i + 1;
                    // Show current page and one page before and after (if they exist)
                    if (
                      pageNumber !== 1 &&
                      pageNumber !== totalPages &&
                      (pageNumber === currentPage ||
                        pageNumber === currentPage - 1 ||
                        pageNumber === currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={pageNumber === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {/* Ellipsis if needed */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Last page (if not the first page) */}
                  {totalPages > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === totalPages}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Next button */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
}

export default OffersPage;
