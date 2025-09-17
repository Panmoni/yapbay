import { useState, useEffect } from 'react';
import { getTradeById, getOfferById, getAccountById, Trade, Offer, Account } from '../api';
import { toast } from 'sonner';
import { handleApiError } from '../utils/errorHandling';

interface UseTradeDetailsResult {
  trade: Trade | null;
  offer: Offer | null;
  creator: Account | null;
  buyerAccount: Account | null;
  sellerAccount: Account | null;
  loading: boolean;
  setTrade: React.Dispatch<React.SetStateAction<Trade | null>>;
}

/**
 * Custom hook to fetch and manage trade details
 * @param tradeId The ID of the trade to fetch
 * @returns Trade details and related data
 */
export function useTradeDetails(tradeId: number | null): UseTradeDetailsResult {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [buyerAccount, setBuyerAccount] = useState<Account | null>(null);
  const [sellerAccount, setSellerAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTradeDetails = async () => {
      if (!tradeId) return;

      setLoading(true);
      try {
        // Fetch trade details
        const tradeResponse = await getTradeById(tradeId);
        console.log('[useTradeDetails] getTradeById response:', tradeResponse);
        console.log('[useTradeDetails] response.data:', tradeResponse.data);

        // The API returns { data: Trade } directly
        const tradeData = tradeResponse.data;
        console.log('[useTradeDetails] extracted tradeData:', tradeData);
        setTrade(tradeData);

        // Fetch related offer
        if (tradeData.leg1_offer_id) {
          const offerResponse = await getOfferById(tradeData.leg1_offer_id);
          console.log('[useTradeDetails] getOfferById response:', offerResponse);
          console.log('[useTradeDetails] offer response.data:', offerResponse.data);
          console.log('[useTradeDetails] offer response.data.offer:', offerResponse.data.offer);

          // Handle potential new API response structure with network wrapper
          const offerData = offerResponse.data.offer || offerResponse.data;
          console.log('[useTradeDetails] extracted offerData:', offerData);
          setOffer(offerData);

          // Fetch creator account
          const creatorResponse = await getAccountById(offerData.creator_account_id);
          console.log('[useTradeDetails] getAccountById response:', creatorResponse);
          console.log('[useTradeDetails] creator response.data:', creatorResponse.data);

          // The API returns { data: Account } directly
          const creatorData = creatorResponse.data;
          console.log('[useTradeDetails] extracted creatorData:', creatorData);
          setCreator(creatorData);

          // Fetch buyer account
          if (tradeData.leg1_buyer_account_id) {
            const buyerResponse = await getAccountById(tradeData.leg1_buyer_account_id);
            const buyerData = buyerResponse.data;
            setBuyerAccount(buyerData);
            // console.log('[DEBUG] Fetched buyer account:', buyerData);
          }

          // Fetch seller account
          if (tradeData.leg1_seller_account_id) {
            const sellerResponse = await getAccountById(tradeData.leg1_seller_account_id);
            const sellerData = sellerResponse.data;
            setSellerAccount(sellerData);
            // console.log('[DEBUG] Fetched seller account:', sellerData);
          }

          // console.log(`Trade state: ${tradeData.leg1_state}`);
        }
      } catch (err) {
        const errorMessage = handleApiError(err, 'Unknown error');
        toast.error(`Failed to load trade details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [tradeId]);

  return {
    trade,
    offer,
    creator,
    buyerAccount,
    sellerAccount,
    loading,
    setTrade,
  };
}
