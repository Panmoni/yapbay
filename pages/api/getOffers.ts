// pages/api/getOffers.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import OfferArtifact from "@/contracts/Offer.sol/Offer.json";

// TODO: status is SCREWED UP and not sure why. It logs as true or false which confuses me.
enum OfferStatus {
  Active,
  Paused,
  Withdrawn,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { id } = req.query;

    const { ALCHEMY_API_URL, OFFER_CONTRACT_ADDRESS } = process.env;

    if (!ALCHEMY_API_URL || !OFFER_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
      const offerContract = new ethers.Contract(
        OFFER_CONTRACT_ADDRESS,
        OfferArtifact.abi,
        provider,
      );

      if (id) {
        // Fetch a specific offer
        const offerId = BigInt(id as string);
        const offer = await offerContract.getOfferDetails(offerId);
        // console.log(offer);

        res.status(200).json({
          id: offerId.toString(),
          owner: offer[0],
          totalTradesAccepted: offer[1].toString(),
          totalTradesCompleted: offer[2].toString(),
          disputesInvolved: offer[3].toString(),
          disputesLost: offer[4].toString(),
          averageTradeVolume: offer[5].toString(),
          minTradeAmount: ethers.formatUnits(offer[6], 18),
          maxTradeAmount: ethers.formatUnits(offer[7], 18),
          fiatCurrency: offer[8],
          status:
            offer[9] === OfferStatus.Active
              ? "Active"
              : offer[9] === OfferStatus.Paused
                ? "Paused"
                : "Withdrawn",
          createdAt: new Date(Number(offer[10]) * 1000).toISOString(),
          updatedAt: new Date(Number(offer[11]) * 1000).toISOString(),
          buyingCrypto: offer[12],
          country: offer[13],
          paymentMethod: offer[14],
          terms: offer[15],
          rate: ethers.formatUnits(offer[16], 2),
          title: offer[17],
        });
      } else {
        // Fetch all offers
        const offerCount = await offerContract.offerCount();
        const offers = [];

        for (let i = 1; i <= Number(offerCount); i++) {
          const offerId = BigInt(i);
          const offer = await offerContract.getOfferDetails(offerId);

          offers.push({
            id: offerId.toString(),
            owner: offer[0],
            totalTradesAccepted: offer[1].toString(),
            totalTradesCompleted: offer[2].toString(),
            disputesInvolved: offer[3].toString(),
            disputesLost: offer[4].toString(),
            averageTradeVolume: offer[5].toString(),
            minTradeAmount: ethers.formatUnits(offer[6], 18),
            maxTradeAmount: ethers.formatUnits(offer[7], 18),
            fiatCurrency: offer[8],
            status: offer[9],
            createdAt: new Date(Number(offer[10]) * 1000).toISOString(),
            updatedAt: new Date(Number(offer[11]) * 1000).toISOString(),
            buyingCrypto: offer[12],
            country: offer[13],
            paymentMethod: offer[14],
            terms: offer[15],
            rate: ethers.formatUnits(offer[16], 2),
            title: offer[17],
          });
        }

        // console.log(offers);
        res.status(200).json(offers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
