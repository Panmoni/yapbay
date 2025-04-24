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
import EditOfferPage from '@/offer/EditOfferPage';
import TradePage from './TradePage';
import { Toaster } from '@/components/ui/sonner'; // Import Toaster

function App() {
  const { primaryWallet } = useDynamicContext();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (primaryWallet) {
      const token = getAuthToken();
      if (token) {
        // console.log("JWT Token:", token);
        console.log('JWT Token found after wallet connect!');
        setAuthToken(token);
      } else {
        console.error('No JWT token found after wallet connect!');
      }
      const getUserData = async () => {
        try {
          const response = await getAccount();
          setAccount(response.data);
        } catch (err) {
          console.error('Failed to fetch account:', err);
        }
      };
      getUserData();
    }
  }, [primaryWallet]);

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
              <Route path="/offer/:id" element={<OfferDetailPage />} />
              <Route path="/edit-offer/:id" element={<EditOfferPage />} />
              <Route path="/trade/:id" element={<TradePage />} />
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
