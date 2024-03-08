// components/contracts/accountForm.tsx

"use client";

import React from "react";
import { useForm } from "react-hook-form";

// Define the form input types
type Inputs = {
  userEmail: string;
  userChatHandle: string;
  userWebsite: string;
  userAvatar: string;
  userRole: string;
};

interface ContractFormProps {
  onSubmit: (data: Inputs) => Promise<void>;
}

const ContractForm: React.FC<ContractFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("userEmail", { required: true })} />
      {errors.userEmail && <span>This field is required</span>}

      <input {...register("userChatHandle")} />
      <input {...register("userWebsite")} />
      <input {...register("userAvatar")} />
      <input {...register("userRole")} />

      <input type="submit" />
    </form>
  );
};

export default ContractForm;
