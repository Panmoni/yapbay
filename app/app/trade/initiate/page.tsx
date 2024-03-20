// @/app/app/trade/initiate/page.tsx
"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import TradeDetails from "@/components/contracts/TradeDetails";

export default function InitiateTradePage() {
  const router = useRouter();

  const [tradeAmount, setTradeAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

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
        <Suspense fallback={<div>Loading trade details...</div>}>
          <TradeDetails />
        </Suspense>
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
      </Container>
    </main>
  );
}
