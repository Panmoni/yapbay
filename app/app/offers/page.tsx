// app/offers/page.tsx
"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { OfferCard } from "@/components/contracts/OfferCard";

interface Offer {
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
}

export default function OffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch("/api/getOffers");

        if (response.ok) {
          const data = await response.json();
          setOffers(data);
        } else {
          setError("Failed to fetch offers");
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
        setError("An error occurred while fetching offers");
      }

      setIsLoading(false);
    };

    fetchOffers();
  }, []);

  return (
    <main>
      <Container>
        <PageTitle title="Available Offers" appRoute />
        {isLoading ? (
          <div className="flex items-center justify-center mb-8">
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center mb-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Fiat Currency</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Min Amount</th>
                <th className="py-3 px-4">Max Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </tbody>
          </table>
        )}
      </Container>
    </main>
  );
}
