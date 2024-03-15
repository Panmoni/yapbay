// @/pages/api/register.ts

import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";

const ACCOUNT_CONTRACT_ADDRESS = process.env.ACCOUNT_CONTRACT;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { userEmail, userChatHandle, userWebsite, userAvatar } = req.body;

    try {
      const provider = new ethers.providers.JsonRpcProvider(
        process.env.ALCHEMY_API_URL,
      );
      const signer = new ethers.Wallet(process.env.ETH_PRIVATE_KEY2, provider);

      const accountContract = new ethers.Contract(
        ACCOUNT_CONTRACT_ADDRESS,
        AccountArtifact.abi,
        signer,
      );

      const tx = await accountContract.userReg(
        ethers.utils.formatBytes32String(userEmail),
        ethers.utils.formatBytes32String(userChatHandle),
        ethers.utils.formatBytes32String(userWebsite),
        userAvatar,
      );

      await tx.wait();

      res.status(200).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "User registration failed" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
