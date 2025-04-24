import { useState } from 'react';
import { deleteOffer, Offer } from '@/api';

interface UseOfferDeletionOptions {
  // Function to update the list of offers after deletion
  setOffersState: React.Dispatch<React.SetStateAction<Offer[]>>;
  // Callback to handle successful deletion (e.g., show a message)
  onSuccess?: (message: string) => void;
  // Callback to handle errors during deletion
  onError?: (message: string) => void;
}

/**
 * Custom hook to manage the deletion of an offer.
 * Handles the API call, updates the offer list state, and provides
 * callbacks for success and error handling.
 */
export function useOfferDeletion({ setOffersState, onSuccess, onError }: UseOfferDeletionOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOffer = async (offerId: number) => {
    setIsDeleting(true);
    try {
      await deleteOffer(offerId.toString());

      // Update the offers list using the provided state setter
      setOffersState(prevOffers => prevOffers.filter(offer => offer.id !== offerId));

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess('Offer deleted successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useOfferDeletion] Delete failed:', err);
      // Call onError callback if provided
      if (onError) {
        onError(`Failed to delete offer: ${errorMessage}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDeleteOffer, isDeleting };
}
