import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { DynamicContextProvider, EvmNetwork, mergeNetworks } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

const myEvmNetworks: EvmNetwork[] = [
  {
    blockExplorerUrls: ['https://alfajores.celoscan.io'],
    chainId: 44787,
    chainName: 'Celo Alfajores',
    iconUrls: ['https://app.dynamic.xyz/assets/networks/celo.svg'],
    name: 'Celo Alfajores',
    nativeCurrency: {
      decimals: 18,
      name: 'Celo',
      symbol: 'CELO',
      iconUrl: 'https://app.dynamic.xyz/assets/networks/celo.svg',
    },
    networkId: 44787,
    rpcUrls: ['https://alfajores-forno.celo-testnet.org'],
    vanityName: 'Alfajores',
  },
];

const DynamicSettings = {
  overrides: {
    evmNetworks: (dashboardNetworks: any[]) => {
      const evmNetworks = dashboardNetworks.filter(
        (network): network is EvmNetwork =>
          'chainId' in network && typeof network.chainId === 'number'
      );
      return mergeNetworks(myEvmNetworks, evmNetworks);
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DynamicContextProvider
      settings={{
        environmentId: '322e23a8-06d7-445f-b525-66426d63d858',
        walletConnectors: [EthereumWalletConnectors],
        overrides: DynamicSettings.overrides,
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);
