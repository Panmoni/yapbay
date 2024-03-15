// @/pages/api/registerUser.ts

import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";

// interface ReqBody {
//   userEmail: string;
//   userChatHandle: string;
//   userWebsite: string;
//   userAvatar: string;
// }

// // Define types for the success response data
// interface ResSuccessData {
//   message: string;
// }

// // Define types for the failure response data
// interface ResErrorData {
//   error: string;
// }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { userEmail, userChatHandle, userWebsite, userAvatar } = req.body;

    if (!userEmail || !userChatHandle || !userWebsite || !userAvatar) {
      res.status(400).json({ error: "Missing user information" });
      return;
    }

    const { ALCHEMY_API_URL, ETH_PRIVATE_KEY2, ACCOUNT_CONTRACT_ADDRESS } =
      process.env;

    if (!ALCHEMY_API_URL || !ETH_PRIVATE_KEY2 || !ACCOUNT_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
      const signer = new ethers.Wallet(ETH_PRIVATE_KEY2, provider);

      const accountContract = new ethers.Contract(
        ACCOUNT_CONTRACT_ADDRESS,
        AccountArtifact.abi,
        signer,
      );

      const tx = await accountContract.userReg(
        ethers.encodeBytes32String(userEmail),
        ethers.encodeBytes32String(userChatHandle),
        ethers.encodeBytes32String(userWebsite),
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
