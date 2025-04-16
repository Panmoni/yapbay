import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trade, Offer, Account } from "../api";
import { formatNumber } from "../lib/utils";

interface TradeDetailsCardProps {
  trade: Trade;
  offer: Offer | null;
  userRole: 'buyer' | 'seller';
  counterparty: Account | null;
}

function TradeDetailsCard({ trade, offer, userRole, counterparty }: TradeDetailsCardProps) {
  // Calculate price from crypto and fiat amounts
  const price = trade.leg1_fiat_amount && trade.leg1_crypto_amount
    ? parseFloat(trade.leg1_fiat_amount) / parseFloat(trade.leg1_crypto_amount)
    : 0;

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };

  // The other party is the counterparty with a more descriptive role
  const otherParty = counterparty;
  const otherPartyRole = userRole === 'buyer' ? "Seller" : "Buyer";

  // Abbreviate wallet address if available
  const abbreviateWallet = (wallet: string) => {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
  };

  const rateAdjustment = offer?.rate_adjustment || 1;
  const token = trade.leg1_crypto_token || offer?.token || "USDC";
  const action = userRole === 'buyer' ? 'buying' : 'selling';
  const marketPosition = rateAdjustment > 1 ? "above" : rateAdjustment < 1 ? "below" : "at";

  return (
    <Card className="border border-gray-200 shadow-sm p-4">
      <CardHeader>
        <h1 className="text-2xl font-bold text-[#5b21b6]">
          Trade #{formatNumber(trade.id)}
        </h1>
        <p className="text-neutral-500">
          Created {new Date(trade.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })} - <span className="text-gray-400">{formatDistanceToNow(new Date(trade.created_at))} ago</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="text-lg mb-4">
          <p>
            You are <strong>{action}</strong> {formatNumber(parseFloat(trade.leg1_crypto_amount))} {token} {""}
            for {trade.leg1_fiat_amount ? formatNumber(parseFloat(trade.leg1_fiat_amount)) : 'N/A'} {trade.from_fiat_currency} {""} at {formatNumber(price)} {trade.from_fiat_currency}/{token}. {""} This is{" "}
            <span className={
              rateAdjustment > 1
                ? 'text-[#059669]'
                : rateAdjustment < 1
                  ? 'text-red-600'
                  : 'text-neutral-600'
            }>
              {formatRate(rateAdjustment)}
            </span>{" "}
            {marketPosition} the market price.
            {offer && (
              <span className="ml-2">
                <a
                  href={`/offers/${offer.id}`}
                  className="text-[#6d28d9] hover:text-[#5b21b6] underline text-sm"
                >
                  [view source offer]
                </a>
              </span>
            )}
          </p>
          <div className="mt-2 text-neutral-600">
            {otherParty && (
              <div className="mt-2 flex items-center">
                <strong className="mr-2">{otherPartyRole}:</strong>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2 overflow-hidden">
                    {otherParty.profile_photo_url ? (
                      <img src={otherParty.profile_photo_url} alt={otherParty.username || "User"} className="w-full h-full object-cover" />
                    ) : (
                      otherParty.username?.[0]?.toUpperCase() || otherParty.wallet_address?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <span className="font-medium mr-1">{otherParty.username || "Anonymous"}</span>
                  {otherParty.wallet_address && (
                    <span className="text-xs text-gray-500 mr-1">({abbreviateWallet(otherParty.wallet_address)})</span>
                  )}
                  <span className="text-xs text-gray-500 mr-2">ID: {otherParty.id}</span>
                  {otherParty.telegram_username && (
                    <a
                      href={`https://t.me/${otherParty.telegram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 flex items-center"
                    >
                      <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                        <path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="#0088cc"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {offer?.terms && (
              <div className="mt-2 mb-3">
                <p className="mb-1"><strong>Terms</strong>:</p>
                <blockquote className="pl-3 border-l-2 border-gray-300 italic text-gray-600 text-base">
                  "{offer.terms}"
                </blockquote>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TradeDetailsCard;
