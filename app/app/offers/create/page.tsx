// @/app/offers/create/page.tsx
"use client";

import React from "react";
import { redirect } from "next/navigation";

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { currencyCodes } from "@/constants/currencyCodes";
import { countryCodes } from "@/constants/countryCodes";

import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ethers } from "ethers";

import OfferArtifact from "@/contracts/Offer.sol/Offer.json";

// TODO: hide if not registered
// TODO: test and cleanup UI
// TODO: redirect, tx message, etc.

interface OfferFormInputs {
  minTradeAmount: string;
  maxTradeAmount: string;
  fiatCurrency: string;
  buyingCrypto: boolean;
  country: string;
  paymentMethod: string;
  terms: string;
  rate: string;
  title: string;
}

const OfferCreatePage = () => {
  const { address, isConnected } = useAccount();
  const [isRegistered, setIsRegistered] = React.useState(false);

  const [offerData, setOfferData] = React.useState<OfferFormInputs>({
    minTradeAmount: "",
    maxTradeAmount: "",
    fiatCurrency: "",
    buyingCrypto: true,
    country: "",
    paymentMethod: "",
    terms: "",
    rate: "",
    title: "",
  });

  React.useEffect(() => {
    const checkUserRegistration = async () => {
      if (isConnected && address) {
        try {
          const response = await fetch(
            `/api/getUserProfile?address=${address}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.userEmail !== "") {
              setIsRegistered(true);
            } else {
              // Set as NOT registered if userEmail empty
              setIsRegistered(false);
            }
          }
        } catch (error) {
          console.error("Error checking user registration:", error);
        }
      }
    };

    checkUserRegistration();
  }, [address, isConnected]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setOfferData({ ...offerData, [name]: newValue });
  };

  const handleBuyingCryptoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfferData({ ...offerData, buyingCrypto: e.target.checked });
  };

  const {
    data: createOfferData,
    writeContract: createOffer,
    isPending: isCreateOfferLoading,
    isSuccess: isCreateOfferStarted,
    error: createOfferError,
  } = useWriteContract();

  const {
    data: txData,
    isSuccess: txSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: createOfferData as `0x${string}`,
    confirmations: 1,
    query: { enabled: !!createOfferData },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) return;

    try {
      await createOffer({
        address: process.env
          .NEXT_PUBLIC_OFFER_CONTRACT_ADDRESS! as `0x${string}`,
        abi: OfferArtifact.abi,
        functionName: "offerCreate",
        args: [
          ethers.parseUnits(offerData.minTradeAmount, 18),
          ethers.parseUnits(offerData.maxTradeAmount, 18),
          offerData.fiatCurrency,
          offerData.buyingCrypto,
          offerData.country,
          offerData.paymentMethod,
          offerData.terms,
          ethers.parseUnits(offerData.rate, 2),
          offerData.title,
        ],
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  React.useEffect(() => {
    if (txSuccess) {
      console.log(txSuccess, txData);
      redirect("/app/offers");
    }
  }, [txSuccess, txData]);

  if (!isConnected) {
    return (
      <main>
        <Container>
          <PageTitle title="Create Offer" />
          <div className="flex items-center justify-center mb-8">
            <h3 className="text-xl">
              Please connect your wallet to create an offer.
            </h3>
          </div>
        </Container>
      </main>
    );
  }

  if (!isRegistered) {
    return (
      <main>
        <Container>
          <PageTitle title="Create Account" appRoute />
          <div className="flex items-center justify-center mb-8">
            <h3 className="text-xl">
              Please create an account first before creating an offer.
            </h3>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <PageTitle title="Create Offer" />
        <div className="flex items-center justify-center mb-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
          >
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
                    checked={offerData.buyingCrypto}
                    onChange={() =>
                      setOfferData({ ...offerData, buyingCrypto: true })
                    }
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
                    checked={!offerData.buyingCrypto}
                    onChange={() =>
                      setOfferData({ ...offerData, buyingCrypto: false })
                    }
                    className="mr-2"
                  />
                  Selling Crypto
                </label>
              </div>
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
                value={offerData.fiatCurrency}
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
              <label
                htmlFor="country"
                className="block text-gray-700 font-bold mb-2"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                value={offerData.country}
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
                htmlFor="minTradeAmount"
                className="block text-gray-700 font-bold mb-2"
              >
                Minimum Fiat Trade Amount
              </label>
              <input
                type="number"
                id="minTradeAmount"
                name="minTradeAmount"
                value={offerData.minTradeAmount}
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
                Maximum Fiat Trade Amount
              </label>
              <input
                type="number"
                id="maxTradeAmount"
                name="maxTradeAmount"
                value={offerData.maxTradeAmount}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
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
                value={offerData.paymentMethod}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="rate"
                className="block text-gray-700 font-bold mb-2"
              >
                Trade Rate (%)
              </label>
              <input
                type="number"
                id="rate"
                name="rate"
                value={offerData.rate}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-gray-700 font-bold mb-2"
              >
                Offer Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={offerData.title}
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
                value={offerData.terms}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              ></textarea>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={isCreateOfferLoading || isCreateOfferStarted}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                {isCreateOfferLoading || isCreateOfferStarted
                  ? "Creating Offer..."
                  : "Create Offer"}
              </button>
            </div>
            {createOfferData && (
              <div className="mt-4 text-xs mx-auto items-center justify-center flex flex-col">
                <h3 className="text-xl text-semibold mb-2">
                  Transaction Created:
                </h3>
                <p className="text-lg">
                  <a
                    target="_blank"
                    href={`https://sepolia.etherscan.io/tx/${createOfferData}`}
                  >
                    {createOfferData.slice(0, 6) +
                      "..." +
                      createOfferData.slice(-6)}{" "}
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
};

export default OfferCreatePage;
