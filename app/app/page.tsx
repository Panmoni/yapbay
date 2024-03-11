// @/app/page.tsx

"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { AccountForm, Inputs } from "@/components/contracts/accountForm";
// import { InterfaceVpcEndpointAttributes } from "aws-cdk-lib/aws-ec2";

const App = () => {
  const onFormSubmit = async (formData: Inputs) => {
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
    <main>
      <Container>
        <PageTitle title="App" />
        <AccountForm onSubmit={onFormSubmit} />
        <p>
          <a className="flex justify-center items-center" href="/app/users">
            user list
          </a>
        </p>
      </Container>
    </main>
  );
};

export default App;
