import { useState, useEffect, useCallback } from 'react';
import { Trade, Account, getAccount } from '@/api';

/**
 * Custom hook to determine and manage a user's role in a trade
 *
 * @param trade The trade object containing buyer and seller information
 * @param offer Optional related offer
 * @returns Object containing the user's role and loading state
 */
export function useUserRole(trade: Trade | null) {
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the current account only once when the hook is initialized
  useEffect(() => {
    const fetchCurrentAccount = async () => {
      try {
        const accountResponse = await getAccount();
        setCurrentAccount(accountResponse.data);
      } catch (error) {
        console.error("Error fetching current account:", error);
      }
    };

    fetchCurrentAccount();
  }, []);

  // Determine user role whenever trade or currentAccount changes
  useEffect(() => {
    const determineUserRole = async () => {
      if (!trade || !currentAccount) return;

      setIsLoading(true);
      try {
        // Log relevant information for debugging
        // console.log("[userRole] Current user account ID:", currentAccount.id);
        // console.log("[userRole] Trade seller account ID:", trade.leg1_seller_account_id);
        // console.log("[userRole] Trade buyer account ID:", trade.leg1_buyer_account_id);

        // Determine user role based on account IDs
        const isSeller = currentAccount.id === trade.leg1_seller_account_id;
        const role = isSeller ? 'seller' : 'buyer';

        // console.log("[userRole] currentAccount:", currentAccount);
        // console.log(`[userRole] User role determined: ${role}`);

        setUserRole(role);
      } catch (error) {
        console.error("Error determining user role:", error);
        // Default to buyer if there's an error
        setUserRole('buyer');
      } finally {
        setIsLoading(false);
      }
    };

    determineUserRole();
  }, [trade, currentAccount]);

  // Function to determine the counterparty role based on user role
  const getCounterpartyRole = useCallback((): 'buyer' | 'seller' => {
    return userRole === 'buyer' ? 'seller' : 'buyer';
  }, [userRole]);

  return {
    userRole,
    currentAccount,
    isLoading,
    getCounterpartyRole
  };
}
