// @/app/app/trade/initiate/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

// Offer interface
import { Offer } from "@/interfaces/offer";

export default function InitiateTradePage() {
  const router = useRouter();
  const params = useSearchParams();

  const [buyOffer, setBuyOffer] = useState<Offer | null>(null);
  const [sellOffer, setSellOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tradeAmount, setTradeAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

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

  const handleCreateTrade = async () => {
    // Implement the logic to create a draft trade
    // You can use the existing API endpoints or create new ones
    // to handle the trade creation process
    console.log("Creating draft trade...");
    console.log("Trade Amount:", tradeAmount);
    console.log("Payment Method:", paymentMethod);
    // Reset the form fields and navigate to the trade details page
    setTradeAmount("");
    setPaymentMethod("");
  };

  return (
    <main>
      <Container>
        <PageTitle title="Initiate Trade" appRoute />
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
            {buyOffer && sellOffer && (
              <>
                <h3 className="text-3xl font-semibold mb-4 text-center capitalize">
                  Chained Trade Details
                </h3>
                <p className="text-xl mb-6 text-center">
                  You are buying crypto with fiat in{" "}
                  <span className="font-bold">{buyOffer.country}</span> via{" "}
                  <span className="font-bold">{buyOffer.paymentMethod}</span>{" "}
                  and your remittance will be delivered in fiat to{" "}
                  <span className="font-bold">{sellOffer.country}</span> via{" "}
                  <span className="font-bold">{sellOffer.paymentMethod}</span>.
                </p>
                {tradeAmount && paymentMethod && (
                  <p className="text-xl mb-6 text-center">
                    You are remitting {tradeAmount} {buyOffer.fiatCurrency}. It
                    is expected that roughly{" "}
                    {(
                      (Number(tradeAmount) *
                        (100.0 - Number(buyOffer.rate)) *
                        (100.0 - Number(sellOffer.rate))) /
                      10000
                    ).toFixed(2)}{" "}
                    {buyOffer.fiatCurrency}
                    will be delivered to your remittance recipient in{" "}
                    {sellOffer.country} in their local currency.
                  </p>
                )}

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
                <div className="flex items-center justify-center mb-8">
                  <form onSubmit={handleCreateTrade}>
                    <div className="mb-4">
                      <label htmlFor="tradeAmount" className="block mb-1">
                        Trade Amount (How much you are remitting)
                      </label>
                      <input
                        type="text"
                        id="tradeAmount"
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                      />
                    </div>
                    <div className="mb-4">
                      <label htmlFor="paymentMethod" className="block mb-1">
                        Payment Details for the Receipt of the Remittance
                      </label>
                      <input
                        type="text"
                        id="paymentMethod"
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                    >
                      Create Draft Trade
                    </button>
                  </form>
                </div>
              </>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
