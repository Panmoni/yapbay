import { useState } from "react";
import { updateAccount, Account } from "./api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timezones } from "@/lib/timezones";
import { countryCodes } from "@/lib/countryCodes";

interface EditAccountFormProps {
  account: Account;
  onSaveSuccess: (account: Account) => void;
  onCancel: () => void;
}

function EditAccountForm({ account, onSaveSuccess, onCancel }: EditAccountFormProps) {
  const [formData, setFormData] = useState({
    username: account.username || "",
    email: account.email || "",
    telegram_username: account.telegram_username || "",
    telegram_id: account.telegram_id ? String(account.telegram_id) : "",
    profile_photo_url: account.profile_photo_url || "",
    phone_country_code: account.phone_country_code || "",
    phone_number: account.phone_number || "",
    available_from: account.available_from || "",
    available_to: account.available_to || "",
    timezone: account.timezone || "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // For country codes, extract just the phone code part
    if (name === "phone_country_code") {
      const phoneCode = value.split('_')[0];
      setFormData((prev) => ({ ...prev, [name]: phoneCode }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Basic validation
    if (!formData.username) {
      setError("Username is required");
      setIsSubmitting(false);
      return;
    }

    if (!formData.email) {
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      // Update telegram_id to a number if provided
      const updateData: Partial<Account> = {
        username: formData.username,
        email: formData.email,
        telegram_username: formData.telegram_username || null,
        telegram_id: formData.telegram_id ? Number(formData.telegram_id) : null,
        profile_photo_url: formData.profile_photo_url || null,
        phone_country_code: formData.phone_country_code || null,
        phone_number: formData.phone_number || null,
        available_from: formData.available_from || null,
        available_to: formData.available_to || null,
        timezone: formData.timezone || null,
      };

      console.log('PUT data being sent:', updateData);
      const response = await updateAccount(account.id, updateData);
      console.log('PUT response:', response);

      // Combine updated data with existing account data
      const updatedAccount: Account = {
        ...account,
        ...updateData,
        id: response.data.id || account.id
      };

      onSaveSuccess(updatedAccount);
    } catch (err) {
      setError(`Failed to update account: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find the matching country code value for the current phone_country_code
  const getCountryCodeValue = () => {
    if (!formData.phone_country_code) return "";
    const countryCode = countryCodes.find(cc => cc.value.startsWith(formData.phone_country_code));
    return countryCode ? countryCode.value : "";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="bg-red-50 border-red-200" variant="destructive">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <label htmlFor="wallet_address" className="block text-sm font-medium text-neutral-700">
          Wallet Address
        </label>
        <Input
          id="wallet_address"
          value={account.wallet_address}
          className="font-mono text-sm bg-neutral-50"
          disabled
        />
        <p className="text-xs text-neutral-500">Your connected wallet address cannot be changed</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
          Username*
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          required
          placeholder="Enter your username"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email Address*
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          required
          placeholder="example@email.com"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="telegram_username" className="block text-sm font-medium text-neutral-700">
          Telegram Username
        </label>
        <Input
          id="telegram_username"
          name="telegram_username"
          type="text"
          value={formData.telegram_username}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          placeholder="username"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="telegram_id" className="block text-sm font-medium text-neutral-700">
          Telegram ID
        </label>
        <Input
          id="telegram_id"
          name="telegram_id"
          type="text"
          value={formData.telegram_id}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          placeholder="12345678"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="phone_country_code" className="block text-sm font-medium text-neutral-700">
          Country Code
        </label>
        <Select
          value={getCountryCodeValue()}
          onValueChange={(value) => handleSelectChange("phone_country_code", value)}
        >
          <SelectTrigger className="border-neutral-300 focus:ring-[#8b5cf6]">
            <SelectValue placeholder="Select country code" />
          </SelectTrigger>
          <SelectContent className="bg-white shadow-md">
            {countryCodes.map((code) => (
              <SelectItem key={code.value} value={code.value}>
                {code.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="phone_number" className="block text-sm font-medium text-neutral-700">
          Phone Number
        </label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          placeholder="555-123-4567"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="timezone" className="block text-sm font-medium text-neutral-700">
          Timezone
        </label>
        <Select
          value={formData.timezone}
          onValueChange={(value) => handleSelectChange("timezone", value)}
        >
          <SelectTrigger className="border-neutral-300 focus:ring-[#8b5cf6]">
            <SelectValue placeholder="Select your timezone" />
          </SelectTrigger>
          <SelectContent className="bg-white shadow-md">
            {timezones.map((timezone) => (
              <SelectItem key={timezone} value={timezone}>
                {timezone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="available_from" className="block text-sm font-medium text-neutral-700">
          Available From
        </label>
        <Input
          id="available_from"
          name="available_from"
          type="time"
          value={formData.available_from}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
        />
        <p className="text-xs text-neutral-500">Your local time when you start being available</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="available_to" className="block text-sm font-medium text-neutral-700">
          Available To
        </label>
        <Input
          id="available_to"
          name="available_to"
          type="time"
          value={formData.available_to}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
        />
        <p className="text-xs text-neutral-500">Your local time when you stop being available</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="profile_photo_url" className="block text-sm font-medium text-neutral-700">
          Profile Photo URL
        </label>
        <Input
          id="profile_photo_url"
          name="profile_photo_url"
          type="url"
          value={formData.profile_photo_url}
          onChange={handleInputChange}
          className="border-neutral-300 focus:border-[#8b5cf6] focus:ring-[#8b5cf6]"
          placeholder="https://example.com/photo.jpg"
        />
        <p className="text-xs text-neutral-500">Enter a URL for your profile photo</p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default EditAccountForm;
