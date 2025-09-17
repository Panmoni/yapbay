import { useState, useEffect } from 'react';
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import HomePage from './Home';
import CreateOfferPage from '@/offer/CreateOfferPage';
import AccountPage from '@/my/MyAccountPage';
import { getAccount, setAuthToken } from './api';
import { Account } from './api';
import Container from '@/components/Shared/Container';

import MyOffersPage from './my/MyOffersPage';
import MyTradesPage from './my/MyTradesPage';
import MyEscrowsPage from './my/MyEscrowsPage';
import OfferDetailPage from '@/offer/OfferDetailPage';
import MyTransactionsPage from './my/MyTransactionsPage';

import EditOfferPage from '@/offer/EditOfferPage';
import TradePage from './TradePage';
import NotFoundPage from '@/pages/NotFoundPage'; // Import the 404 page
import Status from './pages/Status';
import { NetworkTestPage } from './pages/NetworkTestPage'; // Import the network test page
import { Toaster } from 'sonner'; // Import Toaster
import { dispatchAuthStateChange } from './utils/events';

function App() {
  const { primaryWallet } = useDynamicContext();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (primaryWallet) {
      const token = getAuthToken();
      if (token) {
        setAuthToken(token);
      } else {
        console.error('No JWT token found after wallet connect!');
      }
      const getUserData = async () => {
        try {
          const response = await getAccount();
          setAccount(response.data);

          // Dispatch global auth state change event after successful login
          dispatchAuthStateChange(primaryWallet.address);
        } catch (err) {
          // Check if this is a 404 error for account not found
          const axiosError = err as { response?: { status?: number } };
          if (axiosError.response?.status === 404) {
            // Account doesn't exist yet - this is expected for new users
            // The API interceptor already logged a user-friendly warning
            setAccount(null);
          } else {
            // Log other errors normally
            console.error('Failed to fetch account:', err);
          }
        }
      };
      getUserData();
    } else {
      // User has disconnected their wallet
      setAccount(null);

      // Dispatch event for logout as well
      dispatchAuthStateChange(undefined);
    }
  }, [primaryWallet, primaryWallet?.address]);

  return (
    <Router>
      <div className="app">
        <Header isLoggedIn={!!primaryWallet} account={account} />
        <main className="main-content">
          <Container>
            <Routes>
              <Route
                path="/account"
                element={<AccountPage account={account} setAccount={setAccount} />}
              />
              <Route path="/" element={<HomePage />} />
              <Route path="/create-offer" element={<CreateOfferPage account={account} />} />
              <Route path="/offers" element={<MyOffersPage account={account} />} />
              <Route path="/trades" element={<MyTradesPage account={account} />} />
              <Route path="/escrows" element={<MyEscrowsPage account={account} />} />
              <Route path="/transactions" element={<MyTransactionsPage account={account} />} />
              <Route path="/offer/:id" element={<OfferDetailPage />} />
              <Route path="/edit-offer/:id" element={<EditOfferPage />} />
              <Route path="/trade/:id" element={<TradePage />} />
              <Route path="/status" element={<Status />} />
              <Route path="/network-test" element={<NetworkTestPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Container>
        </main>
        <Footer />
        <Toaster position="bottom-right" closeButton={true} duration={10000} richColors />
      </div>
    </Router>
  );
}

export default App;
