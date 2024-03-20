// @/app/offers/manage/[id]/page.tsx
"use client";

import React from "react";
import { redirect } from "next/navigation";

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

import { ethers } from "ethers";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import OfferArtifact from "@/contracts/Offer.sol/Offer.json";
import { currencyCodes } from "@/constants/currencyCodes";
import { countryCodes } from "@/constants/countryCodes";

// TODO: fiatCurrency can not be updated as it's not in the contract function

interface Offer {
  minTradeAmount: string;
  maxTradeAmount: string;
  fiatCurrency: string;
  status: string;
  buyingCrypto: boolean;
  country: string;
  paymentMethod: string;
  terms: string;
  rate: string;
  title: string;
}

export default function ManageOfferPage({
  params,
}: {
  params: { id: string };
}) {
  const { address, isConnected } = useAccount();
  const [offer, setOffer] = React.useState<Offer>({
    minTradeAmount: "",
    maxTradeAmount: "",
    fiatCurrency: "",
    status: "",
    buyingCrypto: false,
    country: "",
    paymentMethod: "",
    terms: "",
    rate: "",
    title: "",
  });

  // Fetch offer details
  React.useEffect(() => {
    const fetchOffer = async () => {
      if (!isConnected || !address) return;

      try {
        const response = await fetch(`/api/getOffers?id=${params.id}`);

        if (response.ok) {
          const data = await response.json();
          setOffer({
            ...data,
          });
        } else {
          console.error("Error fetching offer:", response.status);
        }
      } catch (error) {
        console.error("Error fetching offer:", error);
      }
    };

    fetchOffer();
  }, [address, isConnected, params.id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setOffer({ ...offer, [name]: newValue });
  };

  // wagmi stuff
  const {
    data: updateData,
    writeContract: updateOffer,
    isPending: isUpdateLoading,
    isSuccess: isUpdateStarted,
    error: updateError,
  } = useWriteContract();

  const {
    data: txData,
    isSuccess: txSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: updateData as `0x${string}`,
    confirmations: 1,
    query: { enabled: !!updateData },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) return;

    try {
      await updateOffer({
        address: process.env
          .NEXT_PUBLIC_OFFER_CONTRACT_ADDRESS! as `0x${string}`,
        abi: OfferArtifact.abi,
        functionName: "offerUpdateOffer",
        args: [
          BigInt(params.id),
          ethers.parseUnits(offer.minTradeAmount, 18),
          ethers.parseUnits(offer.maxTradeAmount, 18),
          offer.status === "active",
          offer.buyingCrypto,
          offer.country,
          offer.paymentMethod,
          offer.terms,
          ethers.parseUnits(offer.rate, 2),
          offer.title,
        ],
      });
    } catch (error) {
      console.error("Error updating offer:", error);
    }
  };

  React.useEffect(() => {
    if (txSuccess) {
      console.log(txSuccess, txData);
      redirect(`/app/offers/${params.id}`);
    }
  }, [txSuccess, txData, params.id]);

  // if not connected, ask to connect (JSX)
  if (!isConnected) {
    return (
      <main>
        <Container>
          <PageTitle title="Manage Offer" />
          <div className="flex items-center justify-center mb-8">
            <h3 className="text-xl">
              Please connect your wallet to manage your offer.
            </h3>
          </div>
        </Container>
      </main>
    );
  }

  // if connected, pre-filled update offer form (JSX)
  return (
    <main>
      <Container>
        <PageTitle title="Manage Offer" />
        <div className="flex items-center justify-center mb-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
          >
            {/* Offer form fields */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-gray-700 font-bold mb-2"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={offer.title}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="minTradeAmount"
                className="block text-gray-700 font-bold mb-2"
              >
                Minimum Trade Amount
              </label>
              <input
                type="number"
                id="minTradeAmount"
                name="minTradeAmount"
                value={offer.minTradeAmount}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="maxTradeAmount"
                className="block text-gray-700 font-bold mb-2"
              >
                Maximum Trade Amount
              </label>
              <input
                type="number"
                id="maxTradeAmount"
                name="maxTradeAmount"
                value={offer.maxTradeAmount}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="fiatCurrency"
                className="block text-gray-700 font-bold mb-2"
              >
                Fiat Currency
              </label>
              <select
                id="fiatCurrency"
                name="fiatCurrency"
                value={offer.fiatCurrency}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select currency</option>
                {currencyCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Offer Type
              </label>
              <div className="flex items-center">
                <label htmlFor="buyingCrypto" className="mr-4">
                  <input
                    type="radio"
                    id="buyingCrypto"
                    name="offerType"
                    value="buy"
                    checked={offer.buyingCrypto}
                    onChange={() => setOffer({ ...offer, buyingCrypto: true })}
                    className="mr-2"
                  />
                  Buying Crypto
                </label>
                <label htmlFor="sellingCrypto">
                  <input
                    type="radio"
                    id="sellingCrypto"
                    name="offerType"
                    value="sell"
                    checked={!offer.buyingCrypto}
                    onChange={() => setOffer({ ...offer, buyingCrypto: false })}
                    className="mr-2"
                  />
                  Selling Crypto
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="country"
                className="block text-gray-700 font-bold mb-2"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                value={offer.country}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="">Select country</option>
                {countryCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label
                htmlFor="paymentMethod"
                className="block text-gray-700 font-bold mb-2"
              >
                Payment Method
              </label>
              <input
                type="text"
                id="paymentMethod"
                name="paymentMethod"
                value={offer.paymentMethod}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="terms"
                className="block text-gray-700 font-bold mb-2"
              >
                Terms
              </label>
              <textarea
                id="terms"
                name="terms"
                value={offer.terms}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                htmlFor="rate"
                className="block text-gray-700 font-bold mb-2"
              >
                Rate (%)
              </label>
              <input
                type="number"
                id="rate"
                name="rate"
                value={offer.rate}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="status"
                className="block text-gray-700 font-bold mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={offer.status}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="Active">Active</option>
                <option value="Paused">Paused</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={isUpdateLoading || isUpdateStarted}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                {isUpdateLoading || isUpdateStarted
                  ? "Updating Offer..."
                  : "Update Offer"}
              </button>
            </div>

            {/* show tx hash and link */}
            {updateData && (
              <div className="mt-4 text-xs mx-auto items-center justify-center flex flex-col">
                <h3 className="text-xl text-semibold mb-2">
                  Transaction Created:
                </h3>
                <p className="text-lg">
                  <a
                    target="_blank"
                    href={`https://sepolia.etherscan.io/tx/${updateData}`}
                  >
                    {updateData.slice(0, 6) + "..." + updateData.slice(-6)}{" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      x="0px"
                      y="0px"
                      width="100"
                      height="100"
                      viewBox="0 0 24 24"
                      className="inline h-4 w-4"
                    >
                      <path d="M 5 3 C 3.9069372 3 3 3.9069372 3 5 L 3 19 C 3 20.093063 3.9069372 21 5 21 L 19 21 C 20.093063 21 21 20.093063 21 19 L 21 12 L 19 12 L 19 19 L 5 19 L 5 5 L 12 5 L 12 3 L 5 3 z M 14 3 L 14 5 L 17.585938 5 L 8.2929688 14.292969 L 9.7070312 15.707031 L 19 6.4140625 L 19 10 L 21 10 L 21 3 L 14 3 z"></path>
                    </svg>
                  </a>
                </p>
              </div>
            )}
          </form>
        </div>
      </Container>
    </main>
  );
}
