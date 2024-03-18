// @/app/app/offers/[id]/page.tsx
// offer detail page

"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

import Link from "next/link";

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

// TODO: gotta ensure only offer owners are shown edit link

export default function OfferDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [offer, setOffer] = React.useState<Offer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchOffer = async () => {
      try {
        const response = await fetch(`/api/getOffers?id=${params.id}`);

        if (response.ok) {
          const data = await response.json();
          setOffer(data);
        } else {
          setError("Failed to fetch offer");
        }
      } catch (error) {
        console.error("Error fetching offer:", error);
        setError("An error occurred while fetching the offer");
      }

      setIsLoading(false);
    };

    fetchOffer();
  }, [params.id]);

  return (
    <main>
      <Container>
        <PageTitle title="Offer Details" appRoute />
        {isLoading ? (
          <div className="max-w-2xl mx-auto mb-10">Loading...</div>
        ) : error ? (
          <div className="max-w-2xl mx-auto mb-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : offer ? (
          <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 mb-10">
            <h1 className="text-3xl font-bold mb-4">{offer.title}</h1>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Fiat Currency:</span>{" "}
                {offer.fiatCurrency}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Country:</span> {offer.country}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Min Trade Amount:</span>{" "}
                {offer.minTradeAmount}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Max Trade Amount:</span>{" "}
                {offer.maxTradeAmount}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Payment Method:</span>{" "}
                {offer.paymentMethod}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Rate:</span> {offer.rate}%
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Terms:</span> {offer.terms}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Status:</span> {offer.status}
              </p>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                <Link href={`/app/offers/manage/${offer.id}`}>Edit Offer</Link>
              </p>
            </div>
          </div>
        ) : null}
      </Container>
    </main>
  );
}
