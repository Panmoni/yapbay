import { useState } from 'react';
import { Trade, Account } from '../api';
import {
  markTradeFiatPaid,
  releaseTradeCrypto,
  disputeTrade,
  cancelTrade,
  createAndFundTradeEscrow,
} from '../services/tradeService';

interface WalletClient {
  writeContract: (params: {
    address: `0x${string}`;
    abi: unknown[];
    functionName: string;
    args: unknown[];
  }) => Promise<`0x${string}`>;
}

interface PublicClient {
  getTransactionReceipt: (params: { hash: `0x${string}` }) => Promise<{
    blockNumber: bigint;
    logs: {
      address: string;
      topics: string[];
      data: string;
      blockNumber: bigint;
    }[];
    status: 'success' | 'reverted';
  } | null>;
  getLogs: (params: {
    address: string;
    event: string;
    fromBlock: bigint;
    toBlock: 'latest';
  }) => Promise<
    {
      address: string;
      topics: string[];
      data: string;
      blockNumber: bigint;
    }[]
  >;
  readContract: (params: {
    address: `0x${string}`;
    abi: unknown[];
    functionName?: string;
    args?: unknown[];
  }) => Promise<unknown>;
}

interface UseTradeActionsProps {
  trade: Trade | null;
  primaryWallet: {
    address?: string;
    getWalletClient?: () => Promise<WalletClient>;
    getPublicClient?: () => Promise<PublicClient>;
  };
  counterparty: Account | null;
  userRole: string;
  onRefresh: () => void;
}

interface UseTradeActionsResult {
  createEscrow: () => Promise<void>;
  markFiatPaid: () => Promise<void>;
  releaseCrypto: () => Promise<void>;
  disputeTrade: () => Promise<void>;
  cancelTrade: () => Promise<void>;
  actionLoading: boolean;
}

/**
 * Custom hook to handle trade-related actions
 */
export function useTradeActions({
  trade,
  primaryWallet,
  counterparty,
  onRefresh,
}: UseTradeActionsProps): UseTradeActionsResult {
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Create an escrow for the trade
   */
  const createEscrow = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Check if the wallet has the required methods
      if (!primaryWallet.getWalletClient || !primaryWallet.getPublicClient) {
        throw new Error('Wallet does not have required methods');
      }

      // Get fresh account data for both buyer and seller
      const buyerId = trade.leg1_buyer_account_id;
      const sellerId = trade.leg1_seller_account_id;

      if (!buyerId || !sellerId) {
        throw new Error('Missing buyer or seller account ID in trade data');
      }

      // Use the addresses from the trade data
      const buyerAddress = counterparty?.wallet_address || '';
      const sellerAddress = primaryWallet.address;

      if (!buyerAddress) {
        throw new Error(`Missing buyer wallet address`);
      }

      if (!sellerAddress) {
        throw new Error(`Missing seller wallet address`);
      }

      // Create the escrow
      // Make sure the wallet has the required methods and they are properly bound
      if (
        typeof primaryWallet.getWalletClient === 'function' &&
        typeof primaryWallet.getPublicClient === 'function'
      ) {
        // Create a properly structured wallet object with bound methods
        const walletForEscrow = {
          address: primaryWallet.address,
          getWalletClient: async () => {
            if (primaryWallet.getWalletClient) {
              return await primaryWallet.getWalletClient();
            }
            throw new Error('getWalletClient is not available');
          },
          getPublicClient: async () => {
            if (primaryWallet.getPublicClient) {
              return await primaryWallet.getPublicClient();
            }
            throw new Error('getPublicClient is not available');
          },
        };

        // Use the combined create and fund function instead of just creating the escrow
        await createAndFundTradeEscrow({
          trade,
          primaryWallet: walletForEscrow,
          buyerAddress,
          sellerAddress,
        });
      } else {
        throw new Error('Wallet does not have required methods');
      }

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error creating escrow:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Mark fiat as paid for the trade
   */
  const markFiatPaid = async () => {
    if (!trade || !primaryWallet?.address || !trade.leg1_escrow_onchain_id) return;

    setActionLoading(true);
    try {
      // Make sure the wallet has the required methods
      if (primaryWallet.getWalletClient && primaryWallet.getPublicClient) {
        const walletForMarkPaid = {
          address: primaryWallet.address,
          getWalletClient: async () => {
            if (primaryWallet.getWalletClient) {
              return await primaryWallet.getWalletClient();
            }
            throw new Error('getWalletClient is not available');
          },
          getPublicClient: async () => {
            if (primaryWallet.getPublicClient) {
              return await primaryWallet.getPublicClient();
            }
            throw new Error('getPublicClient is not available');
          },
        };

        await markTradeFiatPaid({
          trade,
          primaryWallet: walletForMarkPaid,
        });
      } else {
        throw new Error('Wallet does not have required methods');
      }

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error marking fiat as paid:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Release crypto for the trade
   */
  const releaseCrypto = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      const walletForRelease = {
        address: primaryWallet.address,
        getWalletClient: async () => {
          if (primaryWallet.getWalletClient) {
            return await primaryWallet.getWalletClient();
          }
          throw new Error('getWalletClient is not available');
        },
        getPublicClient: async () => {
          if (primaryWallet.getPublicClient) {
            return await primaryWallet.getPublicClient();
          }
          throw new Error('getPublicClient is not available');
        },
      };

      await releaseTradeCrypto({
        trade,
        primaryWallet: walletForRelease,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error releasing crypto:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Dispute the trade
   */
  const handleDisputeTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      const walletForDispute = {
        address: primaryWallet.address,
        getWalletClient: async () => {
          if (primaryWallet.getWalletClient) {
            return await primaryWallet.getWalletClient();
          }
          throw new Error('getWalletClient is not available');
        },
        getPublicClient: async () => {
          if (primaryWallet.getPublicClient) {
            return await primaryWallet.getPublicClient();
          }
          throw new Error('getPublicClient is not available');
        },
      };

      await disputeTrade({
        trade,
        primaryWallet: walletForDispute,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error disputing trade:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Cancel the trade
   */
  const handleCancelTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      const walletForCancel = {
        address: primaryWallet.address,
        getWalletClient: async () => {
          if (primaryWallet.getWalletClient) {
            return await primaryWallet.getWalletClient();
          }
          throw new Error('getWalletClient is not available');
        },
        getPublicClient: async () => {
          if (primaryWallet.getPublicClient) {
            return await primaryWallet.getPublicClient();
          }
          throw new Error('getPublicClient is not available');
        },
      };

      await cancelTrade({
        trade,
        primaryWallet: walletForCancel,
      });

      // Refresh the trade data
      onRefresh();
    } catch (err) {
      console.error('Error cancelling trade:', err);
      // Error handling is done in the service
    } finally {
      setActionLoading(false);
    }
  };

  return {
    createEscrow,
    markFiatPaid,
    releaseCrypto,
    disputeTrade: handleDisputeTrade,
    cancelTrade: handleCancelTrade,
    actionLoading,
  };
}
