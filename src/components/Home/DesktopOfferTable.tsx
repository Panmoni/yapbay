import React from 'react';
import { Offer } from '@/api';
import { formatNumber } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import OfferActionButtons from '@/components/Offer/OfferActionButtons';
import TradeConfirmationDialog from '@/components/Trade/TradeConfirmationDialog';
import { abbreviateWallet, formatRate } from '../../utils/stringUtils';

interface DesktopOfferTableProps {
  filteredOffers: Offer[];
  creatorNames: Record<number, string>;
  currentUserAccountId: number | null;
  primaryWallet: { address?: string } | null;
  isDialogOpen: boolean;
  selectedOfferId: number | null;
  handleDeleteOffer: (offerId: number) => Promise<void>;
  isDeletingOffer?: boolean; // Add isDeletingOffer prop
  openTradeDialog: (offerId: number) => void;
  onOpenChange: (open: boolean) => void;
  onConfirmTrade: (offerId: number, amount: string, fiatAmount: number) => void;
}

const DesktopOfferTable: React.FC<DesktopOfferTableProps> = ({
  filteredOffers,
  creatorNames,
  currentUserAccountId,
  primaryWallet,
  isDialogOpen,
  selectedOfferId,
  handleDeleteOffer,
  isDeletingOffer, // Destructure prop
  openTradeDialog,
  onOpenChange,
  onConfirmTrade,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary font-medium">ID</TableHead>
            <TableHead className="text-primary font-medium">Type</TableHead>
            <TableHead className="text-primary font-medium">Creator</TableHead>
            <TableHead className="text-primary font-medium">Min Amount</TableHead>
            <TableHead className="text-primary font-medium">Max Amount</TableHead>
            <TableHead className="text-primary font-medium">Available</TableHead>
            <TableHead className="text-primary font-medium">Rate</TableHead>
            <TableHead className="text-primary font-medium">Currency</TableHead>
            <TableHead className="text-primary font-medium">Updated</TableHead>
            <TableHead className="text-primary font-medium">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOffers.map(offer => (
            <TableRow key={offer.id} className="hover:bg-neutral-50">
              <TableCell>{formatNumber(offer.id)}</TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        offer.offer_type === 'BUY'
                          ? 'bg-success text-neutral-100'
                          : 'bg-error text-neutral-100'
                      }`}
                    >
                      {offer.offer_type}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    className={
                      offer.offer_type === 'BUY'
                        ? 'bg-success text-neutral-100'
                        : 'bg-error text-neutral-100'
                    }
                  >
                    <p>
                      {offer.offer_type === 'BUY'
                        ? 'An offer to buy crypto from you'
                        : 'An offer to sell crypto to you'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                {creatorNames[offer.creator_account_id] ||
                  abbreviateWallet(String(offer.creator_account_id))}
              </TableCell>
              <TableCell>
                {formatNumber(offer.min_amount)} {offer.token}
              </TableCell>
              <TableCell>
                {formatNumber(offer.max_amount)} {offer.token}
              </TableCell>
              <TableCell>
                {formatNumber(offer.total_available_amount)} {offer.token}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{offer.fiat_currency}</TableCell>
              <TableCell className="text-neutral-600 text-sm">
                {formatDistanceToNow(new Date(offer.updated_at))} ago
              </TableCell>
              <TableCell>
                {primaryWallet ? (
                  currentUserAccountId === offer.creator_account_id ? (
                    <OfferActionButtons
                      offerId={offer.id}
                      onDelete={handleDeleteOffer}
                      isDeleting={isDeletingOffer} // Pass down isDeleting prop
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
                          className="bg-success hover:bg-secondary-800 text-white border-none h-8 px-2 w-full flex justify-center"
                        >
                          Preview Trade
                        </Button>
                      }
                    />
                  )
                ) : (
                  <Button className="bg-neutral-400 hover:bg-neutral-500 text-black border-none text-sm px-3 py-1 h-8 cursor-not-allowed">
                    Connect Wallet to Trade
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DesktopOfferTable;
