import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { config } from '../config';
import YapBayEscrowABI from '../utils/YapBayEscrow.json';
import { toast } from 'sonner';

// Define the escrow state type based on the contract
export enum EscrowState {
  CREATED = 0,
  FUNDED = 1,
  RELEASED = 2,
  CANCELLED = 3,
  DISPUTED = 4,
  RESOLVED = 5,
}

// Define the escrow details type
export interface EscrowDetails {
  escrow_id: bigint;
  trade_id: bigint;
  seller: string;
  buyer: string;
  arbitrator: string;
  amount: bigint;
  deposit_deadline: bigint;
  fiat_deadline: bigint;
  state: EscrowState;
  sequential: boolean;
  sequential_escrow_address: string;
  fiat_paid: boolean;
  counter: bigint;
  dispute_initiator: string;
  dispute_bond_buyer: bigint;
  dispute_bond_seller: bigint;
  dispute_timestamp: bigint;
  dispute_evidence_hash: string;
}

export function useEscrowDetails(escrowId: string | number | null, contractAddress?: string) {
  const [escrowDetails, setEscrowDetails] = useState<EscrowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState('0');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to fetch escrow details
  const fetchEscrowDetails = useCallback(
    async (showToast = false) => {
      if (!escrowId) {
        setLoading(false);
        return;
      }

      // Use provided contract address or fall back to config
      const escrowContractAddress = contractAddress || (config.contractAddress as string);

      try {
        setIsRefreshing(true);

        // Connect to the blockchain
        const provider = new ethers.JsonRpcProvider(config.celoRpcUrl);
        const contract = new ethers.Contract(escrowContractAddress, YapBayEscrowABI.abi, provider);

        // Fetch escrow details
        const escrow = await contract.escrows(escrowId);

        // Calculate the balance based on escrow state and amount, rather than querying the contract's total balance
        let escrowBalance = BigInt(0);
        const escrowState = Number(escrow.state);
        const escrowAmount = escrow.amount;

        // If the escrow is FUNDED or in a later state (except CANCELLED), use the escrow amount as the balance
        if (escrowState >= EscrowState.FUNDED && escrowState !== EscrowState.CANCELLED) {
          escrowBalance = escrowAmount;
        }

        setBalance(ethers.formatUnits(escrowBalance, 6)); // USDC has 6 decimals
        setEscrowDetails(escrow as unknown as EscrowDetails);
        setLastUpdated(new Date());
        setError(null);

        if (showToast) {
          toast.success('Escrow details refreshed');
        }
      } catch (err) {
        console.error('Error fetching escrow details:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching escrow details'));

        if (showToast) {
          toast.error('Failed to refresh escrow details');
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [escrowId, contractAddress]
  );

  // Initial fetch and polling setup
  useEffect(() => {
    // Reset state when escrowId changes
    setLoading(true);
    setError(null);
    setEscrowDetails(null);

    if (!escrowId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchEscrowDetails();

    // Set up polling - every 5 seconds
    const interval = setInterval(() => fetchEscrowDetails(), 60000);

    // Cleanup
    return () => clearInterval(interval);
  }, [escrowId, fetchEscrowDetails]);

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
  const states = [
    'CREATED',
    'FUNDED',
    'RELEASED',
    'CANCELLED',
    'DISPUTED',
    'RESOLVED',
  ];
  return states[state] || `UNKNOWN (${state})`;
}
