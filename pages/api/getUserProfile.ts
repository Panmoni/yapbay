// @/pages/api/getUserProfile.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const { address } = req.query;

    if (!address || typeof address !== "string") {
      res.status(400).json({ error: "Missing or invalid address" });
      return;
    }

    const { ALCHEMY_API_URL, ACCOUNT_CONTRACT_ADDRESS } = process.env;

    if (!ALCHEMY_API_URL || !ACCOUNT_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
      const accountContract = new ethers.Contract(
        ACCOUNT_CONTRACT_ADDRESS,
        AccountArtifact.abi,
        provider,
      );

      const userInfo = await accountContract.getUserInfo(address);
      const reputationScore =
        await accountContract.getUserReputationScore(address);

      res.status(200).json({
        userEmail: ethers.decodeBytes32String(userInfo[0].userEmail),
        userChatHandle: ethers.decodeBytes32String(userInfo[0].userChatHandle),
        userWebsite: ethers.decodeBytes32String(userInfo[0].userWebsite),
        userAvatar: userInfo[0].userAvatar,
        userReputationScore: Number(reputationScore),
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
