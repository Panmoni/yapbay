import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Account } from "./api";
import CreateAccountForm from "./CreateAccountForm";
import EditAccountForm from "./EditAccountForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Container from "./components/Container";

interface AccountPageProps {
  account: Account | null;
  setAccount: (account: Account | null) => void;
}

function AccountPage({ account, setAccount }: AccountPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState("");

  if (!primaryWallet) {
    return (
      <Container className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-[#5b21b6] font-semibold">Account Profile</CardTitle>
            <CardDescription>View and manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>Please connect your wallet to view or create your account.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const handleSaveSuccess = (updatedAccount: Account) => {
    setAccount(updatedAccount);
    setIsEditing(false);
    setUpdateSuccess("Your profile has been updated successfully");

    // Clear success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess("");
    }, 3000);
  };

  return (
    <Container className="max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">Account Profile</CardTitle>
              <CardDescription>View and manage your account settings</CardDescription>
            </div>

            {account && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6">
          {updateSuccess && (
            <Alert className="mb-6 bg-[#d1fae5] border-[#a7f3d0]">
              <AlertDescription className="text-[#065f46]">{updateSuccess}</AlertDescription>
            </Alert>
          )}

          {account ? (
            isEditing ? (
              <EditAccountForm
                account={account}
                onSaveSuccess={handleSaveSuccess}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ProfileDisplay account={account} />
            )
          ) : (
            <CreateAccountForm setAccount={setAccount} />
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

// Component for displaying user profile information in a vertical layout
function ProfileDisplay({ account }: { account: Account }) {
  return (
    <div className="space-y-5">
      {account.profile_photo_url && (
        <div className="flex justify-center">
          <img
            src={account.profile_photo_url}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-2 border-purple-200"
          />
        </div>
      )}
      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Wallet Address</h3>
        <p className="text-neutral-700 font-mono text-sm break-all">{account.wallet_address}</p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Username</h3>
        <p className="text-neutral-700">{account.username || '-'}</p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Email</h3>
        <p className="text-neutral-700">{account.email || '-'}</p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Telegram Username</h3>
        <p className="text-neutral-700">{account.telegram_username || '-'}</p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Telegram ID</h3>
        <p className="text-neutral-700">{account.telegram_id || '-'}</p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Phone</h3>
        <p className="text-neutral-700">
          +{account.phone_country_code && account.phone_number
            ? `${account.phone_country_code} ${account.phone_number}`
            : '-'
          }
        </p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Timezone</h3>
        <p className="text-neutral-700">{account.timezone || '-'}</p>
      </div>

      <div className="border-b border-neutral-100 pb-4">
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Available Hours</h3>
        <p className="text-neutral-700">
          {account.available_from && account.available_to
            ? `${account.available_from} - ${account.available_to}`
            : '-'
          }
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-500 mb-1">Member Since</h3>
        <p className="text-neutral-700">
          {new Date(account.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </p>
      </div>
    </div>
  );
}

export default AccountPage;
