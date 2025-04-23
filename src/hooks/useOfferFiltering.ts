import { useState, useCallback, useEffect } from 'react';
import { Offer } from '../api';

interface UseOfferFilteringProps {
  offers: Offer[];
  itemsPerPage: number;
}

interface UseOfferFilteringResult {
  filteredOffers: Offer[];
  tradeType: string;
  currentCurrency: string;
  currentPage: number;
  totalPages: number;
  handleCurrencyChange: (currency: string) => void;
  handleTradeTypeChange: (type: string) => void;
  handlePageChange: (page: number) => void;
}

/**
 * Custom hook to handle filtering and pagination of offers
 */
export const useOfferFiltering = ({
  offers,
  itemsPerPage,
}: UseOfferFilteringProps): UseOfferFilteringResult => {
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [tradeType, setTradeType] = useState<string>('ALL');
  const [currentCurrency, setCurrentCurrency] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Function to apply all active filters - memoized to prevent unnecessary recreations
  const applyFilters = useCallback(() => {
    let filtered = [...offers];

    // Filter by trade type (BUY shows SELL offers, SELL shows BUY offers, ALL shows all)
    if (tradeType === 'BUY') {
      filtered = filtered.filter(offer => offer.offer_type === 'SELL');
    } else if (tradeType === 'SELL') {
      filtered = filtered.filter(offer => offer.offer_type === 'BUY');
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
  };

  const handleTradeTypeChange = (type: string) => {
    setTradeType(type);
    // Reset to first page when changing filters
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return {
    filteredOffers,
    tradeType,
    currentCurrency,
    currentPage,
    totalPages,
    handleCurrencyChange,
    handleTradeTypeChange,
    handlePageChange,
  };
};
