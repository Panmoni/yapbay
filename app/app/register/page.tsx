// @/app/register.tsx

"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { AccountForm, Inputs } from "@/components/contracts/accountForm";

const RegisterPage = () => {
  const onFormSubmit = async (formData: Inputs) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        // Handle successful registration, e.g., redirect to profile page
      } else {
        console.error("Error:", response.status, response.statusText);
        // Handle registration error, e.g., display error message
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle network or other errors
    }
  };

  return (
    <main>
      <Container>
        <PageTitle title="User Registration" />
        <AccountForm onSubmit={onFormSubmit} />
      </Container>
    </main>
  );
};

export default RegisterPage;
