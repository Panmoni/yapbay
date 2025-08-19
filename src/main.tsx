import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';

import { SolanaWalletConnectors } from '@dynamic-labs/solana';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DynamicContextProvider
      settings={{
        environmentId: '322e23a8-06d7-445f-b525-66426d63d858',
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);
