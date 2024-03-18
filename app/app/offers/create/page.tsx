// @/app/offers/create/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ethers } from "ethers";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import OfferArtifact from "@/contracts/Offer.sol/Offer.json";

interface OfferFormInputs {
  minTradeAmount: string;
  maxTradeAmount: string;
  fiatCurrency: string;
}

const OfferCreatePage = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [offerData, setOfferData] = React.useState<OfferFormInputs>({
    minTradeAmount: "",
    maxTradeAmount: "",
    fiatCurrency: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfferData({ ...offerData, [e.target.name]: e.target.value });
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
        ],
      });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  React.useEffect(() => {
    if (txSuccess) {
      console.log(txSuccess, txData);
      router.push("/app/offers");
    }
  }, [txSuccess, txData, router]);

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
                Maximum Trade Amount
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
                htmlFor="fiatCurrency"
                className="block text-gray-700 font-bold mb-2"
              >
                Fiat Currency
              </label>
              <input
                type="text"
                id="fiatCurrency"
                name="fiatCurrency"
                value={offerData.fiatCurrency}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
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
