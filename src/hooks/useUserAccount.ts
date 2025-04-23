import { useState, useEffect } from 'react';
import { getAccount, getAccountById } from '../api';

interface UseUserAccountResult {
  hasUsername: boolean | null;
  currentUserAccountId: number | null;
  creatorNames: Record<number, string>;
  setCreatorNames: React.Dispatch<React.SetStateAction<Record<number, string>>>;
}

/**
 * Custom hook to manage user account data and creator names
 */
export const useUserAccount = (
  primaryWallet: { address?: string } | null
): UseUserAccountResult => {
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<number | null>(null);
  const [creatorNames, setCreatorNames] = useState<Record<number, string>>({});

  // Check if the user has a username
  useEffect(() => {
    const checkUsername = async () => {
      if (primaryWallet) {
        try {
          const accountResponse = await getAccount();
          const hasUsername = !!accountResponse.data.username;
          console.log(
            '[useUserAccount] User has username:',
            hasUsername,
            'Username:',
            accountResponse.data.username
          );
          setHasUsername(hasUsername);

          // Store the current user's account ID
          if (accountResponse.data.id) {
            setCurrentUserAccountId(accountResponse.data.id);
          }
        } catch (err) {
          console.error('[useUserAccount] Failed to fetch user account:', err);

          // Check if it's an Axios error with a 404 status
          const axiosError = err as { response?: { status: number } };
          const isNotFound = axiosError.response && axiosError.response.status === 404;
          console.log('[useUserAccount] Is 404 error:', isNotFound);

          // Set hasUsername to false if it's a 404 error (no account exists)
          setHasUsername(isNotFound ? false : null);

          // Debug current state
          console.log(
            '[useUserAccount] Current state - primaryWallet:',
            !!primaryWallet,
            'hasUsername:',
            isNotFound ? false : null
          );
        }
      } else {
        console.log('[useUserAccount] No wallet connected');
        setCurrentUserAccountId(null);
      }
    };
    checkUsername();
  }, [primaryWallet]);

  return {
    hasUsername,
    currentUserAccountId,
    creatorNames,
    setCreatorNames,
  };
};

/**
 * Fetch creator names for a list of offers
 */
export const fetchCreatorNames = async (
  offers: { creator_account_id: number }[],
  primaryWallet: { address?: string } | null,
  setCreatorNames: React.Dispatch<React.SetStateAction<Record<number, string>>>
): Promise<void> => {
  try {
    // Fetch creator usernames/wallet addresses
    const uniqueCreatorIds = [...new Set(offers.map(o => o.creator_account_id))];
    let names;

    // Only attempt to fetch account information if the user is authenticated
    if (primaryWallet) {
      const namePromises = uniqueCreatorIds.map(async (id: number) => {
        try {
          const accountResponse = await getAccountById(id.toString());
          const account = accountResponse.data;
          return { id, username: account.username || account.wallet_address };
        } catch (err) {
          console.error(`Failed to fetch account ${id}:`, err);
          return { id, username: `User #${id}` };
        }
      });
      names = await Promise.all(namePromises);
    } else {
      // If not authenticated, just use the default "User #id" format without API calls
      names = uniqueCreatorIds.map(id => ({ id, username: `User #${id}` }));
    }

    setCreatorNames(Object.fromEntries(names.map(({ id, username }) => [id, username])));
  } catch (error) {
    console.error('[fetchCreatorNames] Error fetching creator names:', error);
  }
};
