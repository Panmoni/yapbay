import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';
import { formatRate } from '@/utils/stringUtils'; // Added import

interface OfferDescriptionProps {
  offer: Offer;
  className?: string;
}

function OfferDescription({ offer, className = '' }: OfferDescriptionProps) {
  // Removed local formatRate function

  // Determine action based on offer type
  const action = offer.offer_type === 'BUY' ? 'buying' : 'selling';

  return (
    <div className={`text-lg font-medium ${className}`}>
      You are {action} {offer.token} for {offer.fiat_currency} at{' '}
      <span
        className={
          offer.rate_adjustment > 1
            ? 'text-success-600'
            : offer.rate_adjustment < 1
            ? 'text-red-600'
            : 'text-neutral-600'
        }
      >
        {formatRate(offer.rate_adjustment)}
      </span>{' '}
      of the market rate
      <div className="text-sm text-neutral-600 mt-1">
        Min: {formatNumber(offer.min_amount)} {offer.token} | Max: {formatNumber(offer.max_amount)}{' '}
        {offer.token} | Total Available: {formatNumber(offer.total_available_amount)} {offer.token}
      </div>
    </div>
  );
}

export default OfferDescription;
