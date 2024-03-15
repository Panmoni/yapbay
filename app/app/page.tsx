// @/app/page.tsx

"use client";

import React from "react";
import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import { AccountForm, Inputs } from "@/components/contracts/accountForm";
// import { InterfaceVpcEndpointAttributes } from "aws-cdk-lib/aws-ec2";

const App = () => {
  return (
    <main>
      <Container>
        <PageTitle title="App" />
        <div className="my-12 space-y-8 max-w-2xl mx-auto">
          <h3 className="text-xl">Coming Soon</h3>
        </div>
      </Container>
    </main>
  );
};

export default App;
