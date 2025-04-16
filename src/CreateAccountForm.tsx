import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createAccount, Account } from "./api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateAccountFormProps {
  setAccount?: (account: Account | null) => void;
}

function CreateAccountForm({ setAccount }: CreateAccountFormProps) {
  const { primaryWallet } = useDynamicContext();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!primaryWallet?.address) {
      setError("Wallet not connected.");
      setIsSubmitting(false);
      return;
    }

    // Basic validation
    if (!username.trim()) {
      setError("Username is required");
      setIsSubmitting(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await createAccount({
        wallet_address: primaryWallet.address,
        username,
        email,
      });

      const accountId = response.data.id; // Extract id from response
      setSuccess(`Account created with ID: ${accountId}`);

      // Create a new account object with the returned ID and supplied data
      const newAccount: Account = {
        id: accountId,
        wallet_address: primaryWallet.address,
        username,
        email,
        telegram_username: null,
        telegram_id: null,
        profile_photo_url: null,
        phone_country_code: null,
        phone_number: null,
        available_from: null,
        available_to: null,
        timezone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update the parent component's state
      if (setAccount) {
        setAccount(newAccount);
      }

      // Reset form values
      setUsername("");
      setEmail("");
    } catch (err) {
      setError(`Failed to create account: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="bg-red-50 border-red-200" variant="destructive">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-[#d1fae5] border-[#a7f3d0]">
          <AlertDescription className="text-[#065f46]">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <label htmlFor="wallet_address" className="block text-sm font-medium text-neutral-700">
          Wallet Address
        </label>
        <Input
          id="wallet_address"
          value={primaryWallet?.address || ""}
          className="font-mono text-sm bg-neutral-50"
          disabled
        />
        <p className="text-xs text-neutral-500">This is your connected wallet address</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
          Username*
        </label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          required
          placeholder="Choose a username"
        />
        <p className="text-xs text-neutral-500">This will be displayed to other users</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email Address*
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          required
          placeholder="example@email.com"
        />
        <p className="text-xs text-neutral-500">We'll use this for important notifications</p>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white mt-2"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>
    </form>
  );
}

export default CreateAccountForm;
