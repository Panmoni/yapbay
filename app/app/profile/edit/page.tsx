// @/app/profile/edit/page.tsx
"use client";

import React from "react";
import { redirect } from "next/navigation";

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

import { ethers } from "ethers";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import AccountArtifact from "@/contracts/Account.sol/Account.json";

interface UserProfile {
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
}

export default function EditProfilePage() {
  const { address, isConnected } = useAccount();
  const [userProfile, setUserProfile] = React.useState<UserProfile>({
    userEmail: "",
    userChatHandle: "",
    userWebsite: "",
    userAvatar: "",
  });

  // fills in current profile data
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

  // wagmi stuff
  const {
    data: updateData,
    writeContract: updateProfile,
    isPending: isUpdateLoading,
    isSuccess: isUpdateStarted,
    error: updateError,
  } = useWriteContract();

  const {
    data: txData,
    isSuccess: txSuccess,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: updateData as `0x${string}`,
    confirmations: 1,
    query: { enabled: !!updateData },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) return;

    try {
      await updateProfile({
        address: process.env
          .NEXT_PUBLIC_ACCOUNT_CONTRACT_ADDRESS! as `0x${string}`,
        abi: AccountArtifact.abi,
        functionName: "userUpdateProfile",
        args: [
          ethers.encodeBytes32String(userProfile.userEmail),
          ethers.encodeBytes32String(userProfile.userChatHandle),
          ethers.encodeBytes32String(userProfile.userWebsite),
          userProfile.userAvatar || "",
          "",
        ],
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
    }
  };

  // console.log(updateData);

  React.useEffect(() => {
    if (txSuccess) {
      console.log(txSuccess, txData);
      redirect("/app/profile");
    }
  }, [txSuccess, txData]);

  // if not connected, ask to connect (JSX)
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

  // if connected, pre-filled update profile form (JSX)
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
                disabled={isUpdateLoading || isUpdateStarted}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                {isUpdateLoading || isUpdateStarted
                  ? "Pending Confirmation..."
                  : "Update Profile"}
              </button>
            </div>

            {/* show tx hash and link */}
            {updateData && (
              <div className="mt-4 text-xs mx-auto items-center justify-center flex flex-col">
                <h3 className="text-xl text-semibold mb-2">
                  Transaction Created:
                </h3>
                <p className="text-lg">
                  <a
                    target="_blank"
                    href={`https://sepolia.etherscan.io/tx/${updateData}`}
                  >
                    {updateData.slice(0, 6) + "..." + updateData.slice(-6)}{" "}
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
}
