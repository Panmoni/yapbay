// app/offers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { OfferCard } from "@/components/contracts/OfferCard";

// Offer interface
import { Offer } from "@/interfaces/offer";

export default function OffersPage() {
  const [offers, setOffers] = React.useState<Offer[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  const router = useRouter();

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

  const handleOfferSelect = (offerId: string) => {
    const isSelected = selectedOffers.includes(offerId);
    if (isSelected) {
      setSelectedOffers(selectedOffers.filter((id) => id !== offerId));
    } else {
      if (selectedOffers.length < 2) {
        setSelectedOffers([...selectedOffers, offerId]);
      }
    }
  };

  const handleChainOffers = () => {
    if (selectedOffers.length === 2) {
      const [buyOfferId, sellOfferId] = selectedOffers;
      const buyOffer = offers.find((offer) => offer.id === buyOfferId);
      const sellOffer = offers.find((offer) => offer.id === sellOfferId);

      if (buyOffer?.buyingCrypto && !sellOffer?.buyingCrypto) {
        router.push(
          `/app/trade/initiate?buyOfferId=${buyOfferId}&sellOfferId=${sellOfferId}`,
        );
        setSelectedOffers([]);
      } else {
        console.log("Invalid offer selection for chaining");
      }
    }
  };

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
          <>
            {selectedOffers.length === 2 && (
              <div className="flex justify-begin my-4">
                <button
                  onClick={handleChainOffers}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                >
                  Chain Offers
                </button>
              </div>
            )}
            <table className="w-full bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4">Chain?</th>
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
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    onSelect={handleOfferSelect}
                    isSelected={selectedOffers.includes(offer.id)}
                  />
                ))}
              </tbody>
            </table>
          </>
        )}
      </Container>
    </main>
  );
}
