// @/app/profile/page.tsx
"use client";

import React from "react";
import { useAccount } from "wagmi";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

import Image from "next/image";
import Link from "next/link";

interface UserProfile {
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
  userReputationScore: number;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(
    null,
  );

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

  React.useEffect(() => {
    const checkUserRegistration = async () => {
      if (isConnected && address) {
        try {
          const response = await fetch(
            `/api/getUserProfile?address=${address}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.userEmail !== "") {
              setIsRegistered(true);
            } else {
              // Set as NOT registered if userEmail empty
              setIsRegistered(false);
            }
          }
        } catch (error) {
          console.error("Error checking user registration:", error);
        }
      }
    };

    checkUserRegistration();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <main>
        <Container>
          <PageTitle title="User Profile" appRoute />
          <div className="max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl">
              Please connect your wallet to view your profile.
            </h3>
          </div>
        </Container>
      </main>
    );
  }

  if (!userProfile) {
    return (
      <main>
        <Container>
          <PageTitle title="User Profile" appRoute />
          <div className="max-w-2xl mx-auto mb-10">Loading...</div>
        </Container>
      </main>
    );
  }

  if (!isRegistered) {
    return (
      <main>
        <Container>
          <PageTitle title="User Profile" appRoute />
          <div className="flex items-center justify-center mb-8">
            <h3 className="text-xl">Please create an account first.</h3>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <PageTitle title="User Profile" appRoute />
        <div className="max-w-2xl mx-auto mb-10">
          <div className="flex flex-col items-center mb-16 md:mb-12">
            <Image
              src={userProfile.userAvatar}
              height={200}
              width={200}
              alt="User Avatar"
              className="rounded-full"
              priority={true}
            />
            <h2 className="text-2xl font-bold mt-4">
              {userProfile.userChatHandle}
            </h2>
            <p className="mt-2">
              <span className="font-bold">Email:</span> {userProfile.userEmail}
            </p>
            <p className="mt-2">
              <span className="font-bold">Website:</span>{" "}
              {userProfile.userWebsite ? (
                <a
                  href={userProfile.userWebsite}
                  target="_blank"
                  className="underline"
                >
                  {userProfile.userWebsite}
                </a>
              ) : (
                "N/A"
              )}
            </p>
            <p className="mt-2">
              <span className="font-bold">Reputation Score:</span>{" "}
              {userProfile.userReputationScore || 0}
            </p>

            <p className="mt-2">
              <Link href="/app/profile/edit">Edit Profile</Link>
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
