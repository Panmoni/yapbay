import { useState } from 'react';
import { deleteOffer, Offer } from '@/api';
import { toast } from 'sonner'; // Import toast

interface UseOfferDeletionOptions {
  setOffersState?: React.Dispatch<React.SetStateAction<Offer[]>>; // Make optional
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// Define a type for the expected error response data (best effort)
interface PotentialErrorResponse {
  response?: {
    data?: {
      error?: string;
      // Add other potential properties if known
    };
  };
  message?: string; // Standard Error property
}

export function useOfferDeletion({ setOffersState, onSuccess, onError }: UseOfferDeletionOptions) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOffer = async (offerId: number) => {
    setIsDeleting(true);
    try {
      await deleteOffer(offerId);
      // Only update state if setOffersState is provided
      if (setOffersState) {
        setOffersState(prevOffers => prevOffers.filter(offer => offer.id !== offerId));
      }
      if (onSuccess) {
        onSuccess('Offer deleted successfully');
      }
    } catch (err) {
      let errorMessage = 'Unknown error';
      let handledSpecificError = false;

      // Manual check for the specific error structure
      const potentialError = err as PotentialErrorResponse; // Type assertion
      if (
        potentialError &&
        typeof potentialError === 'object' &&
        potentialError.response &&
        typeof potentialError.response === 'object' &&
        potentialError.response.data &&
        typeof potentialError.response.data === 'object' &&
        typeof potentialError.response.data.error === 'string' && // Ensure error is a string
        potentialError.response.data.error.startsWith('Cannot delete - ') // Use startsWith
      ) {
        errorMessage = potentialError.response.data.error; // Use the actual error message from response
        toast.error(errorMessage, {
          duration: 10000, // 10 seconds
        });
        handledSpecificError = true; // Mark as handled
      } else if (err instanceof Error) {
        // Handle generic JavaScript errors
        errorMessage = err.message;
      } else {
        // Handle cases where the thrown value is not an Error object
        try {
          errorMessage = JSON.stringify(err);
        } catch {
          errorMessage = 'An unexpected error occurred';
        }
      }

      // Log only if it's not the specific handled error
      if (!handledSpecificError) {
        console.error('[useOfferDeletion] Delete failed:', err); // Log the original error
        if (onError) {
          // Pass the most relevant error message found
          onError(`Failed to delete offer: ${errorMessage}`);
        }
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDeleteOffer, isDeleting };
}
