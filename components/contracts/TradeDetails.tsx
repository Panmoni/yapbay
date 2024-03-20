// @/components/contracts/TradeDetails.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Offer interface
import { Offer } from "@/interfaces/offer";

export default function TradeDetails() {
  const params = useSearchParams();
  const [buyOffer, setBuyOffer] = useState<Offer | null>(null);
  const [sellOffer, setSellOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffers = async () => {
      const buyOfferId = params?.get("sellOfferId");
      const sellOfferId = params?.get("buyOfferId");

      try {
        const [buyOfferResponse, sellOfferResponse] = await Promise.all([
          fetch(`/api/getOffers?id=${buyOfferId}`),
          fetch(`/api/getOffers?id=${sellOfferId}`),
        ]);

        if (buyOfferResponse.ok && sellOfferResponse.ok) {
          const buyOfferData = await buyOfferResponse.json();
          const sellOfferData = await sellOfferResponse.json();

          setBuyOffer(buyOfferData);
          setSellOffer(sellOfferData);
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
  }, [params]);

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <>
      {buyOffer && sellOffer && (
        <>
          <h3 className="text-3xl font-semibold mb-4 text-center capitalize">
            Chained Trade Details
          </h3>
          <p className="text-xl mb-6 text-center">
            You are buying crypto with fiat in{" "}
            <span className="font-bold">{buyOffer.country}</span> via{" "}
            <span className="font-bold">{buyOffer.paymentMethod}</span> and your
            remittance will be delivered in fiat to{" "}
            <span className="font-bold">{sellOffer.country}</span> via{" "}
            <span className="font-bold">{sellOffer.paymentMethod}</span>.
          </p>
          <div className="flex items-top justify-center mb-8 space-x-12">
            <div className="w-1/3 h-96 border border-gray-300 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-2 uppercase">
                Buy Offer
              </h4>
              <p>Title: {buyOffer.title}</p>
              <p>Fiat Currency: {buyOffer.fiatCurrency}</p>
              <p>Country: {buyOffer.country}</p>
              <p>Min Amount: {buyOffer.minTradeAmount}</p>
              <p>Max Amount: {buyOffer.maxTradeAmount}</p>
              <p>Payment Method: {buyOffer.paymentMethod}</p>
              <p>Rate: {buyOffer.rate}</p>
              <p>Terms: {buyOffer.terms}</p>
            </div>
            <div className="flex items-center justify-center w-32">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </div>
            <div className="w-1/3 h-96 border border-gray-300 p-6 rounded-lg">
              <h4 className="text-xl font-semibold mb-2 uppercase">
                Sell Offer
              </h4>
              <p>Title: {sellOffer.title}</p>
              <p>Fiat Currency: {sellOffer.fiatCurrency}</p>
              <p>Country: {sellOffer.country}</p>
              <p>Min Amount: {sellOffer.minTradeAmount}</p>
              <p>Max Amount: {sellOffer.maxTradeAmount}</p>
              <p>Payment Method: {sellOffer.paymentMethod}</p>
              <p>Rate: {sellOffer.rate}</p>
              <p>Terms: {sellOffer.terms}</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
