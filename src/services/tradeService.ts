import {
  createTrade,
  Offer,
  Trade,
  recordEscrow,
  markFiatPaid,
  releaseEscrow,
  disputeEscrow,
  cancelEscrow,
  getTradeById,
  recordTransaction,
} from '../api';
import { formatNumber } from '../lib/utils';
import { handleApiError } from '../utils/errorHandling';
import { toast } from 'sonner';
import { createEscrowTransaction, markFiatPaidTransaction, checkAndFundEscrow } from './chainService';
import { config } from '../config';

interface StartTradeParams {
  offerId: number;
  amount?: string;
  fiatAmount?: number;
  offer: Offer;
  primaryWallet: { address?: string } | null;
  onSuccess: (tradeId: number) => void;
  onError: (error: Error) => void;
}

interface TransactionResult {
  txHash: string;
  blockNumber?: number;
  escrowId?: string;
  escrowAddress?: string;
}

interface EscrowResponseWithTx {
  txHash: string;
  blockNumber?: number;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Initiates a new trade based on an offer
 */
export const startTrade = async ({
  offerId,
  amount = '1000000',
  fiatAmount = 0,
  offer,
  primaryWallet,
  onSuccess,
  onError,
}: StartTradeParams): Promise<void> => {
  try {
    if (!offer) {
      throw new Error('Offer not found');
    }

    const tradeData = {
      leg1_offer_id: offerId,
      leg1_crypto_amount: amount,
      leg1_fiat_amount: fiatAmount.toString(),
      from_fiat_currency: offer.fiat_currency,
      destination_fiat_currency: offer.fiat_currency,
    };

    const tradeResponse = await createTrade(tradeData);
    const tradeId = tradeResponse.data.id;

    if (primaryWallet) {
      // MVP: Escrow creation moved to TradePage to happen manually by user action
      // const seller = primaryWallet.address;
      // const buyer = String(offer.creator_account_id);
      //
      // const escrowData = {
      //   trade_id: tradeId,
      //   escrow_id: Math.floor(Math.random() * 1000000),
      //   seller,
      //   buyer,
      //   amount: parseFloat(amount),
      // };
      //
      // const escrowResponse = await createEscrow(escrowData);
      // console.log("[TradeService] Escrow instruction generated:", escrowResponse.data);

      onSuccess(tradeId);
    } else {
      alert(`Trade ${formatNumber(tradeId)} started, but no wallet connected`);
      onError(new Error('No wallet connected'));
    }
  } catch (err) {
    console.error('[TradeService] Trade failed:', err);
    onError(err instanceof Error ? err : new Error('Unknown error'));
  }
};

/**
 * Parameters for creating an escrow
 */
interface CreateEscrowParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
    getWalletClient: () => Promise<unknown>;
    getPublicClient: () => Promise<unknown>;
  };
  buyerAddress: string;
  sellerAddress: string;
}

/**
 * Creates an escrow for a trade on the blockchain and records it in the backend
 */
export const createTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  try {
    // Show notification message using toast
    toast('Creating escrow on blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Create the escrow transaction on the blockchain
    const txResult = await createEscrowTransaction(primaryWallet, {
      tradeId: trade.id,
      buyer: buyerAddress,
      amount: parseFloat(trade.leg1_crypto_amount || '0'),
      sequential: false,
      sequentialEscrowAddress: undefined,
      arbitrator: config.arbitratorAddress || '0x0000000000000000000000000000000000000000',
    });

    console.log('[DEBUG] Transaction result:', txResult);

    // Record the transaction in our transaction system
    await recordTransaction({
      trade_id: trade.id,
      transaction_hash: txResult.txHash,
      transaction_type: 'CREATE_ESCROW',
      from_address: sellerAddress,
      to_address: buyerAddress,
      amount: trade.leg1_crypto_amount,
      token_type: trade.leg1_crypto_token,
      status: 'SUCCESS',
      block_number: txResult.blockNumber,
      metadata: {
        escrow_id: txResult.escrowId,
        arbitrator: config.arbitratorAddress
      }
    });

    // Now notify the backend about the successful transaction (legacy system)
    const recordData = {
      trade_id: trade.id,
      transaction_hash: txResult.txHash,
      escrow_id: txResult.escrowId,
      seller: sellerAddress,
      buyer: buyerAddress,
      amount: parseFloat(trade.leg1_crypto_amount || '0'),
      sequential: false,
      arbitrator: config.arbitratorAddress || '0x0000000000000000000000000000000000000000',
    };

    await recordEscrow(recordData);

    toast.success('Escrow created successfully!');

    return txResult;
  } catch (err) {
    console.error('Error creating escrow:', err);
    const errorMessage = handleApiError(err, 'Failed to create escrow: Unknown error');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Creates an escrow for a trade and immediately prompts to fund it
 * This combines the escrow creation and funding steps into one flow
 */
export const createAndFundTradeEscrow = async ({
  trade,
  primaryWallet,
  buyerAddress,
  sellerAddress,
}: CreateEscrowParams) => {
  try {
    // First create the escrow
    const escrowResult = await createTradeEscrow({
      trade,
      primaryWallet,
      buyerAddress,
      sellerAddress,
    });

    // Then check and fund it - note: only pass 2 arguments if that's what the function expects
    const fundResult = await checkAndFundEscrow(
      primaryWallet,
      escrowResult.escrowId
    );

    // Convert result to expected format
    const txResult: TransactionResult = typeof fundResult === 'string' 
      ? { txHash: fundResult } 
      : fundResult as TransactionResult;

    // Record the funding transaction
    if (txResult && 'txHash' in txResult) {
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: parseInt(escrowResult.escrowId),
        transaction_hash: txResult.txHash,
        transaction_type: 'FUND_ESCROW',
        from_address: sellerAddress,
        to_address: txResult.escrowAddress || '',
        amount: trade.leg1_crypto_amount,
        token_type: trade.leg1_crypto_token,
        status: 'SUCCESS',
        block_number: txResult.blockNumber,
        metadata: {
          escrow_id: escrowResult.escrowId
        }
      });
    }

    return { escrow: escrowResult, fund: txResult };
  } catch (err) {
    console.error('Error in create and fund escrow flow:', err);
    const errorMessage = handleApiError(err, 'Failed to create and fund escrow');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for marking fiat as paid
 */
interface MarkFiatPaidParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
    getWalletClient: () => Promise<unknown>;
    getPublicClient: () => Promise<unknown>;
  };
}

/**
 * Marks fiat as paid for a trade on the blockchain and in the backend
 */
export const markTradeFiatPaid = async ({ trade, primaryWallet }: MarkFiatPaidParams) => {
  try {
    if (!trade.leg1_escrow_onchain_id) {
      throw new Error('No escrow ID found for this trade');
    }

    // Show notification message using toast
    toast('Marking fiat as paid on blockchain...', {
      description: 'Please approve the transaction in your wallet.',
    });

    // Call blockchain service to mark fiat as paid
    const result = await markFiatPaidTransaction(primaryWallet, trade.leg1_escrow_onchain_id);
    
    // Convert result to expected format
    const txResult: TransactionResult = typeof result === 'string' 
      ? { txHash: result } 
      : result as TransactionResult;

    // Record the transaction
    if (txResult && 'txHash' in txResult) {
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: parseInt(trade.leg1_escrow_onchain_id),
        transaction_hash: txResult.txHash,
        transaction_type: 'MARK_FIAT_PAID',
        from_address: primaryWallet.address || '',
        status: 'SUCCESS',
        block_number: txResult.blockNumber,
        metadata: {
          escrow_id: trade.leg1_escrow_onchain_id
        }
      });
    }

    // Call API to update backend state
    await markFiatPaid(trade.id);

    toast.success('Fiat payment marked as paid successfully!');

    return txResult;
  } catch (err) {
    console.error('Error marking fiat as paid:', err);
    const errorMessage = handleApiError(err, 'Failed to mark fiat as paid');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for releasing crypto
 */
interface ReleaseCryptoParams {
  trade: Trade;
  primaryWallet: { address?: string };
}

/**
 * Releases crypto for a trade
 */
export const releaseTradeCrypto = async ({
  trade,
  primaryWallet,
}: ReleaseCryptoParams): Promise<void> => {
  try {
    // Call API to release escrow
    const response = await releaseEscrow({
      escrow_id: trade.id,
      trade_id: trade.id,
      authority: primaryWallet.address || '',
      buyer_token_account: 'placeholder', // This would come from the wallet
      arbitrator_token_account: 'placeholder', // This would be a system account
    });

    // Record the transaction if we have a transaction hash
    if (response?.data && typeof response.data === 'object' && 'txHash' in response.data) {
      // Cast to unknown first, then to our type to avoid TypeScript errors
      const txData = response.data as unknown as EscrowResponseWithTx;
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: trade.id,
        transaction_hash: txData.txHash,
        transaction_type: 'RELEASE_ESCROW',
        from_address: primaryWallet.address || '',
        to_address: trade.leg1_buyer_account_id?.toString() || '',
        amount: trade.leg1_crypto_amount,
        token_type: trade.leg1_crypto_token,
        status: 'SUCCESS',
        block_number: txData.blockNumber,
      });
    }

    toast.success('Crypto released successfully!');
  } catch (err) {
    console.error('Error releasing crypto:', err);
    const errorMessage = handleApiError(err, 'Failed to release crypto');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for disputing a trade
 */
interface DisputeTradeParams {
  trade: Trade;
  primaryWallet: { address?: string };
}

/**
 * Disputes a trade
 */
export const disputeTrade = async ({ trade, primaryWallet }: DisputeTradeParams): Promise<void> => {
  try {
    // Call API to dispute escrow
    const response = await disputeEscrow({
      escrow_id: trade.id,
      trade_id: trade.id,
      disputing_party: primaryWallet.address || '',
      disputing_party_token_account: 'placeholder', // This would come from the wallet
    });

    // Record the transaction if we have a transaction hash
    if (response?.data && typeof response.data === 'object' && 'txHash' in response.data) {
      // Cast to unknown first, then to our type to avoid TypeScript errors
      const txData = response.data as unknown as EscrowResponseWithTx;
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: trade.id,
        transaction_hash: txData.txHash,
        transaction_type: 'DISPUTE_ESCROW',
        from_address: primaryWallet.address || '',
        status: 'SUCCESS',
        block_number: txData.blockNumber,
        metadata: {
          disputing_party: primaryWallet.address || ''
        }
      });
    }

    toast.success('Trade disputed successfully');
  } catch (err) {
    console.error('Error disputing trade:', err);
    const errorMessage = handleApiError(err, 'Failed to dispute trade');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Parameters for cancelling a trade
 */
interface CancelTradeParams {
  trade: Trade;
  primaryWallet: { address?: string };
  userRole: string;
  counterpartyAddress?: string;
}

/**
 * Cancels a trade
 */
export const cancelTrade = async ({
  trade,
  primaryWallet,
  userRole,
  counterpartyAddress,
}: CancelTradeParams): Promise<void> => {
  try {
    // Call API to cancel escrow
    const response = await cancelEscrow({
      escrow_id: trade.id,
      trade_id: trade.id,
      seller: userRole === 'seller' ? primaryWallet.address || '' : counterpartyAddress || '',
      authority: primaryWallet.address || '',
    });

    // Record the transaction if we have a transaction hash
    if (response?.data && typeof response.data === 'object' && 'txHash' in response.data) {
      // Cast to unknown first, then to our type to avoid TypeScript errors
      const txData = response.data as unknown as EscrowResponseWithTx;
      await recordTransaction({
        trade_id: trade.id,
        escrow_id: trade.id,
        transaction_hash: txData.txHash,
        transaction_type: 'CANCEL_ESCROW',
        from_address: primaryWallet.address || '',
        to_address: userRole === 'seller' ? (primaryWallet.address || '') : (counterpartyAddress || ''),
        status: 'SUCCESS',
        block_number: txData.blockNumber,
        metadata: {
          cancelled_by: userRole,
          authority: primaryWallet.address || ''
        }
      });
    }

    toast.success('Trade cancelled successfully');
  } catch (err) {
    console.error('Error cancelling trade:', err);
    const errorMessage = handleApiError(err, 'Failed to cancel trade');
    toast.error(errorMessage);
    throw err;
  }
};

/**
 * Refreshes trade data
 */
export const refreshTrade = async (
  tradeId: number,
  setTrade: (trade: Trade) => void
): Promise<void> => {
  try {
    const updatedTrade = await getTradeById(tradeId.toString());
    setTrade(updatedTrade.data);
  } catch (err) {
    console.error('Error refreshing trade:', err);
    const errorMessage = handleApiError(err, 'Failed to refresh trade data');
    toast.error(errorMessage);
  }
};
