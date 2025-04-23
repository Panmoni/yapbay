import { useState, useEffect } from 'react';
import { getPrices, PricesResponse } from '../../api';

interface UsePriceDataResult {
  priceData: PricesResponse | null;
  loading: boolean;
  error: string | null;
  fetchPriceData: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage price data
 */
export const usePriceData = (isOpen: boolean): UsePriceDataResult => {
  const [priceData, setPriceData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching price data...');
      const response = await getPrices();
      console.log('Price data response:', response);

      // Check if we have valid data
      if (response && response.data && response.data.data && response.data.data.USDC) {
        console.log('Setting price data:', response.data);
        setPriceData(response.data);
      } else {
        console.error('Invalid price data format:', response);
        setError('Received invalid price data format. Please try again.');
      }
    } catch (err) {
      console.error('Failed to fetch price data:', err);
      setError('Failed to fetch current market prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch price data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPriceData();
    }
  }, [isOpen]);

  return { priceData, loading, error, fetchPriceData };
};
