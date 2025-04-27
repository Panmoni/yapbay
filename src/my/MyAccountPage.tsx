import { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Account } from '@/api';
import CreateAccountForm from '@/components/Account/CreateAccountForm';
import EditAccountForm from '@/components/Account/EditAccountForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Container from '@/components/Shared/Container';
import {
  AtSign,
  CheckCircle,
  Clock,
  Copy,
  Globe,
  Mail,
  Pencil,
  Phone,
  Send,
  Settings,
  User,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { abbreviateWallet } from '@/utils/stringUtils';

interface AccountPageProps {
  account: Account | null;
  setAccount: (account: Account | null) => void;
}

function AccountPage({ account, setAccount }: AccountPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [isEditing, setIsEditing] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  if (!primaryWallet) {
    return (
      <Container className="max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800 font-semibold">Account Profile</CardTitle>
            <CardDescription>View and manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>
                Please connect your wallet to view or create your account.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const handleSaveSuccess = (updatedAccount: Account) => {
    setAccount(updatedAccount);
    setIsEditing(false);
    setUpdateSuccess('Your profile has been updated successfully');

    // Clear success message after 3 seconds
    setTimeout(() => {
      setUpdateSuccess('');
    }, 3000);
  };

  return (
    <Container className="max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-primary-800 font-semibold">Account Profile</CardTitle>
              <CardDescription>View and manage your account settings</CardDescription>
            </div>

            {account && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-primary-700 hover:bg-primary-800 text-white"
                size="sm"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {updateSuccess && (
            <Alert className="mb-6 bg-secondary-50 border border-secondary-200 text-secondary-800">
              <CheckCircle className="h-4 w-4 text-secondary-500 mr-2" />
              <AlertDescription className="text-secondary-800">{updateSuccess}</AlertDescription>
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

// Component for displaying user profile information in a modern, responsive layout
function ProfileDisplay({ account }: { account: Account }) {
  return (
    <div className="w-full">
      {/* Mobile view (single column) and Desktop view (two columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Profile photo and key info */}
        <div className="md:col-span-4 space-y-6">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-neutral-100">
            <div className="relative mb-4">
              {account.profile_photo_url ? (
                <img
                  src={account.profile_photo_url}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-2 border-primary-200 shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center shadow-md">
                  <User className="h-16 w-16 text-primary-400" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white"></div>
            </div>

            {/* Username */}
            <h2 className="text-xl font-semibold text-neutral-800 mb-1">
              {account.username || 'Anonymous User'}
            </h2>

            {/* Wallet Address with copy button */}
            <div className="w-full mt-3 mb-2">
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-1 bg-neutral-50 rounded-md px-3 py-1.5 w-auto overflow-hidden">
                  <Wallet className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <p className="text-xs font-mono text-neutral-600 mx-1">
                    {abbreviateWallet(account.wallet_address)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(account.wallet_address);
                      toast.success('Wallet address copied to clipboard');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-center text-sm text-neutral-500 mt-2">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>
                Member since{' '}
                {new Date(account.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right column - Detailed information */}
        <div className="md:col-span-8 space-y-6">
          {/* Contact Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-700 flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary-500" />
                Contact Information
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Email */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <AtSign className="h-4 w-4 text-primary-500" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-neutral-500">Email</h4>
                  <p className="text-sm text-neutral-800">{account.email || '-'}</p>
                </div>
              </div>

              {/* Telegram */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <Send className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-neutral-500">Telegram</h4>
                  <p className="text-sm text-neutral-800">
                    {account.telegram_username ? `@${account.telegram_username}` : '-'}
                    {account.telegram_id && (
                      <span className="text-xs text-neutral-400 ml-2">
                        ID: {account.telegram_id}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <Phone className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-neutral-500">Phone</h4>
                  <p className="text-sm text-neutral-800">
                    {account.phone_country_code && account.phone_number
                      ? `+${account.phone_country_code} ${account.phone_number}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-100 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
              <h3 className="text-sm font-medium text-neutral-700 flex items-center">
                <Settings className="h-4 w-4 mr-2 text-primary-500" />
                Preferences
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Timezone */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <Globe className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-neutral-500">Timezone</h4>
                  <p className="text-sm text-neutral-800">{account.timezone || '-'}</p>
                </div>
              </div>

              {/* Available Hours */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center mr-3 flex-shrink-0">
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-neutral-500">Available Hours</h4>
                  <p className="text-sm text-neutral-800">
                    {account.available_from && account.available_to
                      ? `${account.available_from} - ${account.available_to}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
