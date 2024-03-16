// components/contracts/accountForm.tsx

import React, { useState } from "react";

// Define the form input types
export type Inputs = {
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
};

interface AccountFormProps {
  onSubmit: (data: Inputs) => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({ onSubmit }) => {
  const [inputs, setInputs] = useState<Inputs>({
    userEmail: "",
    userChatHandle: "",
    userWebsite: "",
    userAvatar: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputs);
  };

  return (
    <div className="flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="userEmail"
          >
            Email
          </label>
          <input
            name="userEmail"
            value={inputs.userEmail}
            onChange={handleChange}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="userChatHandle"
          >
            Chat Handle
          </label>
          <input
            name="userChatHandle"
            value={inputs.userChatHandle}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="userWebsite"
          >
            Website
          </label>
          <input
            name="userWebsite"
            value={inputs.userWebsite}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="userAvatar"
          >
            Avatar
          </label>
          <input
            name="userAvatar"
            value={inputs.userAvatar}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};
