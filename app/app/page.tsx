// @/app/page.tsx

"use client";

import React from "react";
import ContractForm from "@/components/contracts/accountForm";

const MyPage = () => {
  const onFormSubmit = async (formData) => {
    try {
      const response = await fetch("/api/submitForm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
      } else {
        console.error("Error:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      <ContractForm onSubmit={onFormSubmit} />{" "}
      <p>
        <a className="flex justify-center items-center" href="/app/users">
          user list
        </a>
      </p>
    </>
  );
};

export default MyPage;
