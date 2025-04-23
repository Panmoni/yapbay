import { createTrade, Offer } from '../api';
import { formatNumber } from '../lib/utils';

interface StartTradeParams {
  offerId: number;
  amount?: string;
  fiatAmount?: number;
  offer: Offer;
  primaryWallet: { address?: string } | null;
  onSuccess: (tradeId: number) => void;
  onError: (error: Error) => void;
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
