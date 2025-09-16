import { useCallback } from 'react';
import {
  createOfferWithNetwork,
  getOffersWithNetwork,
  getOfferByIdWithNetwork,
  updateOfferWithNetwork,
  deleteOfferWithNetwork,
  Offer,
} from '@/api';

/**
 * Hook for network-aware offer operations
 * @param networkName The network name to use for API calls (default: 'solana-devnet')
 * @returns Network-aware offer API functions
 */
export const useNetworkAwareOffers = (networkName: string = 'solana-devnet') => {
  const createOffer = useCallback(
    (data: Partial<Omit<Offer, 'id' | 'creator_account_id' | 'created_at' | 'updated_at'>>) => {
      console.log('[useNetworkAwareOffers] createOffer called with network:', networkName);
      console.log('[useNetworkAwareOffers] createOffer data:', data);
      return createOfferWithNetwork(networkName, data);
    },
    [networkName]
  );

  const getOffers = useCallback(
    (params?: { type?: string; token?: string; owner?: string }) =>
      getOffersWithNetwork(networkName, params),
    [networkName]
  );

  const getOfferById = useCallback(
    (id: number) => getOfferByIdWithNetwork(networkName, id),
    [networkName]
  );

  const updateOffer = useCallback(
    (
      id: number,
      data: Partial<Omit<Offer, 'id' | 'creator_account_id' | 'created_at' | 'updated_at'>>
    ) => updateOfferWithNetwork(networkName, id, data),
    [networkName]
  );

  const deleteOffer = useCallback(
    (id: number) => deleteOfferWithNetwork(networkName, id),
    [networkName]
  );

  return {
    createOffer,
    getOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
    networkName,
  };
};

/**
 * Hook for Solana devnet operations (convenience hook)
 */
export const useSolanaDevnetOffers = () => {
  return useNetworkAwareOffers('solana-devnet');
};
