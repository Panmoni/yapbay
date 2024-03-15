// pages/api/userList.js
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";


export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { ALCHEMY_API_URL, ACCOUNT_CONTRACT_ADDRESS } = process.env;

  try {
    // Connect to the Ethereum network using ethers.js
    const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);

    // Create an instance of the account contract
    const accountContract = new ethers.Contract(
      ACCOUNT_CONTRACT_ADDRESS,
      AccountArtifact.abi,
      provider,
    );

    // Retrieve the total number of registered users
    const userCount = await accountContract.userCount();

    // Fetch user details for each registered user
    const userPromises = [];
    for (let i = 1; i <= userCount; i++) {
      userPromises.push(accountContract.userIdToAddress(i));
    }

    const userAddresses = await Promise.all(userPromises);

    const userDetailsPromises = userAddresses.map((address) =>
      accountContract.userBasicInfo(address),
    );

    const userDetails = await Promise.all(userDetailsPromises);

    // Transform user details into an array of user objects
    const usersData = userDetails.map((user) => ({
      userId: user[0].toString(),
      userEmail: ethers.decodeBytes32String(user[1]),
      userChatHandle: ethers.decodeBytes32String(user[2]),
      userWebsite: ethers.decodeBytes32String(user[3]),
      userAvatar: user[4],
      userRole: user[5],
    }));

    // Return the user list as a JSON response
    res.status(200).json({ users: usersData });
  } catch (error) {
    // Handle errors
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
}
