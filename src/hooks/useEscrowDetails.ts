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
        
        // Get the actual USDC balance for this specific escrow
        const usdcAddress = config.usdcAddressAlfajores;
        
        // Minimal ERC20 ABI for balanceOf
        const erc20BalanceOfAbi = [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ];
        
        // Create a contract instance for the USDC token
        const usdcContract = new ethers.Contract(usdcAddress, erc20BalanceOfAbi, provider);
        
        // Query the actual USDC balance
        let escrowBalance = BigInt(0);
        
        try {
          // If this is a sequential escrow, check the sequential escrow address
          if (escrow.sequential && escrow.sequential_escrow_address !== ethers.ZeroAddress) {
            escrowBalance = await usdcContract.balanceOf(escrow.sequential_escrow_address);
            console.log(`[DEBUG] Sequential escrow ${escrowId} balance: ${escrowBalance.toString()}`);
          } else {
            // For non-sequential escrows, we need to check if the contract has the funds for this escrow
            // The escrow contract should have a function to check the balance for a specific escrow
            // If such a function exists, we should use it
            // For now, we'll use the state to determine if there should be a balance
            const escrowState = Number(escrow.state);
            
            // Only show a balance for FUNDED escrows
            if (escrowState === EscrowState.FUNDED) {
              escrowBalance = escrow.amount;
              console.log(`[DEBUG] Non-sequential escrow ${escrowId} in FUNDED state, using amount: ${escrowBalance.toString()}`);
            } else {
              console.log(`[DEBUG] Escrow ${escrowId} in state ${escrowState}, setting balance to 0`);
            }
          }
        } catch (balanceError) {
          console.error('Error fetching USDC balance:', balanceError);
          // If balance check fails, fall back to a safer approach
          const escrowState = Number(escrow.state);
          if (escrowState === EscrowState.FUNDED) {
            escrowBalance = escrow.amount;
            console.log(`[DEBUG] Balance check failed, using escrow amount for FUNDED escrow: ${escrowBalance.toString()}`);
          }
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

    // Set up polling - every 60 seconds
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
