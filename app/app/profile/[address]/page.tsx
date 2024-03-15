// @/app/profile/[address]/page.tsx
"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { ethers } from "ethers";
import AccountArtifact from "@/contracts/Account.sol/Account.json";
import Image from "next/image";

interface UserProfile {
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
  userReputationScore: number;
}

const ProfilePage = ({ params }: { params: { address: string } }) => {
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(
    null,
  );

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(
          process.env.ALCHEMY_API_URL,
        );
        const accountContract = new ethers.Contract(
          process.env.ACCOUNT_CONTRACT_ADDRESS!,
          AccountArtifact.abi,
          provider,
        );

        const userInfo = await accountContract.getUserInfo(params.address);
        const reputationScore = await accountContract.getUserReputationScore(
          params.address,
        );

        setUserProfile({
          userEmail: ethers.decodeBytes32String(userInfo[0].userEmail),
          userChatHandle: ethers.decodeBytes32String(
            userInfo[0].userChatHandle,
          ),
          userWebsite: ethers.decodeBytes32String(userInfo[0].userWebsite),
          userAvatar: userInfo[0].userAvatar,
          userReputationScore: reputationScore.toNumber(),
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [params.address]);

  if (!userProfile) {
    return (
      <main>
        <Container>
          <PageTitle title="User Profile" appRoute />
          <div>Loading...</div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <PageTitle title="User Profile" appRoute />
        <div>
          <Image
            src={userProfile.userAvatar}
            alt="User Avatar"
            height={64}
            width={64}
          />
          <h2>{userProfile.userChatHandle}</h2>
          <p>Email: {userProfile.userEmail}</p>
          <p>Website: {userProfile.userWebsite}</p>
          <p>Reputation Score: {userProfile.userReputationScore}</p>
        </div>
      </Container>
    </main>
  );
};

export default ProfilePage;
