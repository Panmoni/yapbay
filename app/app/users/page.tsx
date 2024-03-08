// pages/users.tsx

"use client";

import { useEffect, useState } from "react";

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
    <div className="flex justify-center items-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">User List</h1>
        {users.length === 0 ? (
          <p className="text-center">Loading users...</p>
        ) : (
          <table className="w-full bg-white shadow-md rounded-lg overflow-hidden">
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
                  <td className="py-4 px-6">{user.userChatHandle}</td>
                  <td className="py-4 px-6">{user.userWebsite}</td>
                  <td className="py-4 px-6">{user.userAvatar}</td>
                  <td className="py-4 px-6">{user.userRole}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
