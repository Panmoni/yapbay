// @/lib/rainbowkit.js
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  getDefaultWallets,
} from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  trustWallet,
  bitgetWallet,
  rabbyWallet,
  // Chain,
} from "@rainbow-me/rainbowkit/wallets";

import { WagmiProvider } from "wagmi";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const { wallets } = getDefaultWallets();

// This way is slow
// import { sepolia } from "wagmi/chains";

const sepolia = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "SEP", decimals: 18 },
  rpcUrls: {
    alchemy: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_API_URL],
    },
    default: {
      http: [process.env.NEXT_PUBLIC_ALCHEMY_API_URL],
    },
    public: { http: ["https://rpc.ankr.com/eth_sepolia"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  contracts: {
    ensRegistry: {
      address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    },
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 751532,
    },
  },
  testnet: true,
};

// WalletConnect
const config = getDefaultConfig({
  appName: "YapBay",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  wallets: [
    ...wallets,
    {
      groupName: "More",
      wallets: [rabbyWallet, argentWallet, trustWallet, bitgetWallet],
    },
  ],
  chains: [sepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export const Providers = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
