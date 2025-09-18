import { useState, useEffect, useCallback } from 'react';
import { blockchainService } from '../services/blockchainService.js';
import { toast } from 'sonner';
import { BN } from '@coral-xyz/anchor';

// Define the escrow state type based on the Solana program
export enum EscrowState {
  CREATED = 0,
  FUNDED = 1,
  RELEASED = 2,
  CANCELLED = 3,
  DISPUTED = 4,
  RESOLVED = 5,
}

// Define the escrow details type for Solana
export interface EscrowDetails {
  escrowId: number;
  tradeId: number;
  seller: string;
  buyer: string;
  arbitrator: string;
  amount: BN;
  depositDeadline: BN;
  fiatDeadline: BN;
  state: EscrowState;
  sequential: boolean;
  sequentialEscrowAddress: string;
  fiatPaid: boolean;
  counter: BN;
  disputeInitiator: string;
  disputeBondBuyer: BN;
  disputeBondSeller: BN;
  disputeTimestamp: BN;
  disputeEvidenceHash: string;
}

export function useEscrowDetails(escrowAddress: string | null) {
  const [escrowDetails, setEscrowDetails] = useState<EscrowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState('0');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch escrow details
  const fetchEscrowDetails = useCallback(
    async (showToast = false) => {
      if (!escrowAddress) {
        setLoading(false);
        return;
      }

      try {
        setIsRefreshing(true);

        console.log(`[DEBUG] Fetching Solana escrow details for address: ${escrowAddress}`);

        // Fetch escrow state from Solana program using the address directly
        const escrowState = await blockchainService.getEscrowStateByAddress(escrowAddress);

        // Get the actual balance from the escrow using the address directly
        const escrowBalance = await blockchainService.getEscrowBalanceByAddress(escrowAddress);

        console.log(`[DEBUG] Solana escrow ${escrowAddress} balance: ${escrowBalance.toString()}`);

        // Convert BN to string for display (USDC has 6 decimals)
        const balanceString = (escrowBalance / 1_000_000).toFixed(6);
        setBalance(balanceString);

        // Convert the escrow state to our interface
        const details: EscrowDetails = {
          escrowId: escrowState.id,
          tradeId: escrowState.tradeId,
          seller: escrowState.sellerAddress,
          buyer: escrowState.buyerAddress,
          arbitrator: escrowState.arbitratorAddress,
          amount: new BN(escrowState.amount),
          depositDeadline: 0, // We'll need to get this from somewhere else
          fiatDeadline: 0, // We'll need to get this from somewhere else
          state: escrowState.state,
          sequential: false, // We'll need to get this from somewhere else
          sequentialEscrowAddress: '', // We'll need to get this from somewhere else
          fiatPaid: false, // We'll need to get this from somewhere else
          counter: 0, // We'll need to get this from somewhere else
          disputeInitiator: '', // We'll need to get this from somewhere else
          disputeBondBuyer: new BN(0), // We'll need to get this from somewhere else
          disputeBondSeller: new BN(0), // We'll need to get this from somewhere else
          disputeTimestamp: 0, // We'll need to get this from somewhere else
          disputeEvidenceHash: '', // We'll need to get this from somewhere else
        };

        setEscrowDetails(details);
        setLastUpdated(new Date());
        setError(null);

        if (showToast) {
          toast.success('Escrow details refreshed');
        }
      } catch (err) {
        console.error('Error fetching Solana escrow details:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching escrow details'));

        if (showToast) {
          toast.error('Failed to refresh escrow details');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [escrowAddress]
  );

  // Initial fetch and polling setup
  useEffect(() => {
    // Reset state when escrowAddress changes
    setLoading(true);
    setError(null);
    setEscrowDetails(null);

    if (!escrowAddress) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchEscrowDetails();

    // Set up polling - every 60 seconds
    const interval = setInterval(() => fetchEscrowDetails(), 60000);

    // Cleanup
    return () => clearInterval(interval);
  }, [escrowAddress, fetchEscrowDetails]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchEscrowDetails(true);
  }, [fetchEscrowDetails]);

  return {
    escrowDetails,
    loading,
    error,
    balance,
    lastUpdated,
    isRefreshing,
    refresh,
  };
}

// Helper function to convert numeric state to readable name
export function getEscrowStateName(state: number): string {
  const states = ['CREATED', 'FUNDED', 'RELEASED', 'CANCELLED', 'DISPUTED', 'RESOLVED'];
  return states[state] || `UNKNOWN (${state})`;
}
