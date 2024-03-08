// pages/api/submitForm.js
import { ethers } from "ethers";
import { accountContractAbi } from "@/abis/accountAbi";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const {
    ALCHEMY_API_URL,
    ETH_PRIVATE_KEY1,
    ETH_PRIVATE_KEY2,
    ACCOUNT_CONTRACT_ADDRESS,
  } = process.env;

  try {
    // Initialize a provider with your Alchemy node
    const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);

    // Initialize a wallet using your private key
    const wallet = new ethers.Wallet(ETH_PRIVATE_KEY2);

    // Connect the wallet to the provider
    const signer = wallet.connect(provider);

    // Create a contract instance for your Account contract
    const accountContract = new ethers.Contract(
      ACCOUNT_CONTRACT_ADDRESS,
      accountContractAbi,
      signer,
    );

    // Extract the form values from the request body
    const { userEmail, userChatHandle, userWebsite, userAvatar, userRole } =
      req.body;

    // Encode the form values as bytes32
    const encodedEmail = ethers.encodeBytes32String(userEmail);
    const encodedChatHandle = ethers.encodeBytes32String(userChatHandle);
    const encodedWebsite = ethers.encodeBytes32String(userWebsite);

    // Call the contract function with the encoded values
    const tx = await accountContract.userReg(
      encodedEmail,
      encodedChatHandle,
      encodedWebsite,
      userAvatar,
      userRole,
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Return a successful response
    res.status(200).json({ message: "Transaction successful", receipt });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({ message: "An error occurred", error });
  }
}
