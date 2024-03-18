// @/components/contracts/OfferCard.tsx
import Link from "next/link";

interface OfferCardProps {
  offer: {
    id: string;
    owner: string;
    totalTradesAccepted: string;
    totalTradesCompleted: string;
    disputesInvolved: string;
    disputesLost: string;
    averageTradeVolume: string;
    minTradeAmount: string;
    maxTradeAmount: string;
    fiatCurrency: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    buyingCrypto: boolean;
    country: string;
    paymentMethod: string;
    terms: string;
    rate: string;
    title: string;
  };
}

export function OfferCard({ offer }: OfferCardProps) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-4 px-6">{offer.title}</td>
      <td className="py-4 px-6">
        {offer.buyingCrypto ? "Buying" : "Selling"} Crypto
      </td>
      <td className="py-4 px-6">{offer.fiatCurrency}</td>
      <td className="py-4 px-6">{offer.country}</td>
      <td className="py-4 px-6">{offer.minTradeAmount}</td>
      <td className="py-4 px-6">{offer.maxTradeAmount}</td>
      <td className="py-4 px-6">{offer.paymentMethod}</td>
      <td className="py-4 px-6">{offer.rate}%</td>
      <td className="py-4 px-6">
        <Link
          href={`/app/offers/${offer.id}`}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-2 rounded text-sm"
        >
          Details
        </Link>
      </td>
    </tr>
  );
}
