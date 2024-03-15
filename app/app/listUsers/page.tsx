// @/app/app/listUsers/page.tsx

"use client";

import { useEffect, useState } from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import Image from "next/image";
import Link from "next/link";

interface User {
  userId: string;
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
  userRole: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/userList");
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <main>
      <Container>
        <PageTitle title="User List" appRoute />

        {users.length === 0 ? (
          <p className="text-center">Loading users...</p>
        ) : (
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Chat Handle</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Avatar</th>
                <th className="py-3 px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId} className="border-b border-gray-200">
                  <td className="py-4 px-6">{user.userId}</td>
                  <td className="py-4 px-6">{user.userEmail}</td>
                  <td className="py-4 px-6">
                    <Link href={`https://t.me/${user.userChatHandle}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="24"
                        height="24"
                        viewBox="0 0 48 48"
                        className="inline mr-2"
                      >
                        <path
                          fill="#29b6f6"
                          d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"
                        ></path>
                        <path
                          fill="#fff"
                          d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
                        ></path>
                        <path
                          fill="#b0bec5"
                          d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
                        ></path>
                        <path
                          fill="#cfd8dc"
                          d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
                        ></path>
                      </svg>

                      {user.userChatHandle}
                    </Link>
                  </td>
                  <td className="py-4 px-6">
                    <Link href={user.userWebsite}>{user.userWebsite}</Link>
                  </td>
                  <td className="py-4 px-6">
                    <Image
                      src={user.userAvatar}
                      height={48}
                      width={48}
                      alt={user.userEmail}
                    />
                  </td>
                  <td className="py-4 px-6">{user.userRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Container>
    </main>
  );
};

export default UsersPage;
