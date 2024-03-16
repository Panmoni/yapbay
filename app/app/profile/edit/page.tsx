// @/app/profile/edit/page.tsx
"use client";

import React from "react";
import { useAccount, useWalletClient } from "wagmi";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";
import { redirect } from "next/navigation";

interface UserProfile {
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
}

export default function EditProfilePage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [userProfile, setUserProfile] = React.useState<UserProfile>({
    userEmail: "",
    userChatHandle: "",
    userWebsite: "",
    userAvatar: "",
  });

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isConnected || !address) return;

      try {
        const response = await fetch(`/api/getUserProfile?address=${address}`);

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        } else {
          console.error("Error fetching user profile:", response.status);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [address, isConnected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile({ ...userProfile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address || !walletClient) return;

    try {
      const accountContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_ACCOUNT_CONTRACT_ADDRESS!,
        AccountArtifact.abi,
        walletClient,
      );

      const tx = await accountContract.userUpdateProfile(
        ethers.encodeBytes32String(userProfile.userEmail),
        ethers.encodeBytes32String(userProfile.userChatHandle),
        ethers.encodeBytes32String(userProfile.userWebsite),
        userProfile.userAvatar || "",
        "",
      );

      await tx.wait();

      redirect("/app/profile");
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  if (!isConnected) {
    return (
      <main>
        <Container>
          <PageTitle title="Edit Profile" />
          <div className="flex items-center justify-center mb-8">
            <h3 className="text-xl">
              Please connect your wallet to edit your profile.
            </h3>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <PageTitle title="Edit Profile" />
        <div className="flex items-center justify-center mb-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
          >
            <div className="mb-4">
              <label
                htmlFor="userEmail"
                className="block text-gray-700 font-bold mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="userEmail"
                name="userEmail"
                value={userProfile.userEmail}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="userChatHandle"
                className="block text-gray-700 font-bold mb-2"
              >
                Chat Handle
              </label>
              <input
                type="text"
                id="userChatHandle"
                name="userChatHandle"
                value={userProfile.userChatHandle}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="userWebsite"
                className="block text-gray-700 font-bold mb-2"
              >
                Website
              </label>
              <input
                type="text"
                id="userWebsite"
                name="userWebsite"
                value={userProfile.userWebsite}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="userAvatar"
                className="block text-gray-700 font-bold mb-2"
              >
                Avatar URL
              </label>
              <input
                type="text"
                id="userAvatar"
                name="userAvatar"
                value={userProfile.userAvatar}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div className="flex items-center justify-center">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </Container>
    </main>
  );
}
