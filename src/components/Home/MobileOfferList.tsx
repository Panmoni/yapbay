import React from 'react';
import { Offer } from '@/api';
import { formatNumber } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import OfferActionButtons from '@/components/Offer/OfferActionButtons';
import TradeConfirmationDialog from '@/components/Trade/TradeConfirmationDialog';
import { abbreviateWallet, formatRate } from '../../utils/stringUtils';

interface MobileOfferListProps {
  filteredOffers: Offer[];
  creatorNames: Record<number, string>;
  currentUserAccountId: number | null;
  primaryWallet: { address?: string } | null;
  isDialogOpen: boolean;
  selectedOfferId: number | null;
  handleDeleteOffer: (offerId: number) => Promise<void>;
  openTradeDialog: (offerId: number) => void;
  onOpenChange: (open: boolean) => void;
  onConfirmTrade: (offerId: number, amount: string, fiatAmount: number) => void;
}

const MobileOfferList: React.FC<MobileOfferListProps> = ({
  filteredOffers,
  creatorNames,
  currentUserAccountId,
  primaryWallet,
  isDialogOpen,
  selectedOfferId,
  handleDeleteOffer,
  openTradeDialog,
  onOpenChange,
  onConfirmTrade,
}) => {
  return (
    <div className="md:hidden p-4 space-y-4">
      {filteredOffers.map(offer => (
        <div key={offer.id} className="mobile-card-view">
          <div className="mobile-card-view-header">
            <span>{formatNumber(offer.id)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    offer.offer_type === 'BUY'
                      ? 'bg-secondary-500 text-neutral-100'
                      : 'bg-amber-500 text-neutral-100'
                  }`}
                >
                  {offer.offer_type}
                </span>
              </TooltipTrigger>
              <TooltipContent
                className={
                  offer.offer_type === 'BUY'
                    ? 'bg-secondary-500 text-neutral-100'
                    : 'bg-amber-500 text-neutral-100'
                }
              >
                <p>
                  {offer.offer_type === 'BUY'
                    ? 'An offer to buy crypto from you'
                    : 'An offer to sell crypto to you'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="mobile-card-view-row">
            <span className="mobile-card-view-label">Creator</span>
            <span>
              {creatorNames[offer.creator_account_id] ||
                abbreviateWallet(String(offer.creator_account_id))}
            </span>
          </div>

          <div className="mobile-card-view-row">
            <span className="mobile-card-view-label">Amount</span>
            <span>
              {formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}
            </span>
          </div>

          <div className="mobile-card-view-row">
            <span className="mobile-card-view-label">Available</span>
            <span>
              {formatNumber(offer.total_available_amount)} {offer.token}
            </span>
          </div>

          <div className="mobile-card-view-row">
            <span className="mobile-card-view-label">Rate</span>
            <span
              className={
                offer.rate_adjustment > 1
                  ? 'text-success'
                  : offer.rate_adjustment < 1
                  ? 'text-red-600'
                  : 'text-neutral-600'
              }
            >
              {formatRate(offer.rate_adjustment)}
            </span>
          </div>

          <div className="mobile-card-view-row">
            <span className="mobile-card-view-label">Currency</span>
            <span>{offer.fiat_currency}</span>
          </div>

          <div className="mobile-card-view-row">
            <span className="mobile-card-view-label">Updated</span>
            <span className="text-neutral-600 text-sm">
              {formatDistanceToNow(new Date(offer.updated_at))} ago
            </span>
          </div>

          <div className="mt-4">
            {primaryWallet ? (
              currentUserAccountId === offer.creator_account_id ? (
                <OfferActionButtons
                  offerId={offer.id}
                  onDelete={handleDeleteOffer}
                  isMobile={true}
                />
              ) : (
                <TradeConfirmationDialog
                  isOpen={isDialogOpen && selectedOfferId === offer.id}
                  onOpenChange={onOpenChange}
                  offer={offer}
                  onConfirm={onConfirmTrade}
                  triggerButton={
                    <Button
                      onClick={() => openTradeDialog(offer.id)}
                      className="bg-secondary-500 hover:bg-secondary-900 text-white w-full flex justify-center"
                    >
                      Preview Trade
                    </Button>
                  }
                />
              )
            ) : (
              <Button className="bg-neutral-400 hover:bg-neutral-500 text-black w-full flex justify-center cursor-not-allowed">
                Connect Wallet to Trade
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileOfferList;
