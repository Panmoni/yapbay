// @/pages/api/updateUserRole.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { address, userRole } = req.body;

    if (!address || !userRole) {
      res.status(400).json({ error: "Missing user information" });
      return;
    }

    const { ALCHEMY_API_URL, ETH_PRIVATE_KEY1, ACCOUNT_CONTRACT_ADDRESS } =
      process.env;

    if (!ALCHEMY_API_URL || !ETH_PRIVATE_KEY1 || !ACCOUNT_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
      const signer = new ethers.Wallet(ETH_PRIVATE_KEY1, provider);
      const accountContract = new ethers.Contract(
        ACCOUNT_CONTRACT_ADDRESS,
        AccountArtifact.abi,
        signer,
      );

      // Fetch the current user data
      const userInfo = await accountContract.getUserInfo(address);

      const tx = await accountContract.userUpdateProfile(
        userInfo[0].userEmail,
        userInfo[0].userChatHandle,
        userInfo[0].userWebsite,
        userInfo[0].userAvatar,
        userRole,
      );

      await tx.wait();

      res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
