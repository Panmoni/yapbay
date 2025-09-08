# Dynamic Docs for Solana

# Solana integration

The `@dynamic-labs/solana-extension` integrates your application with the `@solana/web3.js` library, providing a `Connection` and `Signer` to interact with the Solana blockchain.

### Installation

To install the Solana extension, run the following command:

```
npm install @dynamic-labs/solana-extension
```

### Setup

Incorporate the Solana extension into your client using the extend method to add getSigner and getConnection methods:

```ts
import { createClient } from '@dynamic-labs/client';
import { SolanaExtension } from '@dynamic-labs/solana-extension';

/**
 * Creates and extends the client with Solana blockchain functionality.
 */
export const dynamicClient = createClient({
  environmentId: 'YOUR-ENVIRONMENT-ID',
}).extend(SolanaExtension());
```

Also please refer to the [Polyfills](/react-native/polyfills) section for information on how to set up necessary polyfills.

### Usage

After setup, you can interact with the Solana blockchain. Below is an example of a component that sends 1 SOL to a specified wallet address:

```tsx
import { Button } from 'react-native';
import { FC } from 'react';
import { dynamicClient } from '<path to client file>';

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

interface Send1SolButtonProps {
  destinationAddress: string;
}

/**
 * Renders a button that sends 1 SOL to a given address.
 */
const Send1SolButton: FC<Send1SolButtonProps> = ({ destinationAddress }) => {
  const send = async () => {
    const wallet = dynamicClient.wallets.primary;

    if (!wallet) return;

    const connection = dynamicClient.solana.getConnection({
      commitment: 'singleGossip',
    });
    const signer = dynamicClient.solana.getSigner({ wallet });

    const { blockhash } = await connection.getLatestBlockhash();
    const amountInLamports = 1 * LAMPORTS_PER_SOL;
    const fromKey = new PublicKey(wallet.address);
    const toKey = new PublicKey(destinationAddress);

    const instructions = [
      SystemProgram.transfer({
        fromPubkey: fromKey,
        lamports: amountInLamports,
        toPubkey: toKey,
      }),
    ];

    const messageV0 = new TransactionMessage({
      instructions,
      payerKey: fromKey,
      recentBlockhash: blockhash,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    const { signature } = await signer.signAndSendTransaction(transaction);

    console.log('Successful transaction signature:', signature);
  };

  return <Button title="Send" onPress={send} />;
};
```

# Configure Web3.js Connection

> Modify Web3.js Connection to your unique needs.

## Configurable Wallet Connectors

In some cases you would want to override the default settings of the Web3.js Connection.

Dynamic allows you do to so by passing [`SolanaConnectionConfig`](https://solana.com/docs/clients/javascript-reference#connection) prop and an additional `customRpcUrls` property to `SolanaWalletConnectorsWithConfig`

For example:

```jsx
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { SolanaWalletConnectorsWithConfig } from '@dynamic-labs/solana';

<DynamicContextProvider
  settings={{
    walletConnectors: [
      SolanaWalletConnectorsWithConfig({
        commitment: "confirmed",
        httpHeaders: {
          "X-Requested-With": "XMLHttpRequest",
        },
        customRpcUrls: {
          solana: ["http://YOUR_URL"],
          eclipse: ["http://YOUR_URL"],
        },
      }),
    ],
    ... // other settings
  }}
>
  {...}
</DynamicContextProvider>

```

# Using Anchor with Dynamic

> Learn how to connect Solana's Anchor framework to Dynamic's wallet SDK in a React app.

## Prerequisites

- A [React or Next.js app](https://www.dynamic.xyz/docs/example-apps) set up with [Dynamic's React SDK](https://www.dynamic.xyz/docs/quickstart)
- Installed dependencies:
  - `@coral-xyz/anchor`
  - `@solana/web3.js`
  - `@dynamic-labs/sdk-react-core`
  - `@dynamic-labs/solana`
- Your Anchor program's IDL and TypeScript types

---

## Step 1: Create the Anchor Provider Context

Create a file (e.g., `AnchorProviderComponent.tsx`) and add the following code. This context will provide your Anchor program, connection, provider, and public key throughout your app.

```tsx
'use client';

import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isSolanaWallet } from '@dynamic-labs/solana';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Import your program's types and IDL
import { YourProgram } from './path-to-your-program-types';
import yourProgramIdl from './path-to-your-idl.json';

interface AnchorProviderContextValue {
  program: Program<YourProgram> | null;
  connection: Connection | null;
  provider: AnchorProvider | null;
  publicKey: PublicKey | null;
}

const AnchorProviderContext = createContext<AnchorProviderContextValue>({
  program: null,
  connection: null,
  provider: null,
  publicKey: null,
});

export function useAnchorProvider() {
  return useContext(AnchorProviderContext);
}

interface AnchorProviderProps {
  children: ReactNode;
}

export default function AnchorProviderComponent({ children }: AnchorProviderProps) {
  const { primaryWallet, sdkHasLoaded } = useDynamicContext();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program<YourProgram> | null>(null);

  // Derive the public key from the connected wallet
  const publicKey = useMemo(() => {
    if (!primaryWallet?.address) return null;
    try {
      return new PublicKey(primaryWallet.address);
    } catch (error) {
      console.error('Invalid public key:', error);
      return null;
    }
  }, [primaryWallet?.address]);

  // Initialize Anchor when wallet or SDK state changes
  const initAnchor = useCallback(async () => {
    if (!primaryWallet || !sdkHasLoaded || !publicKey) {
      setConnection(null);
      setProvider(null);
      setProgram(null);
      return;
    }

    try {
      if (!isSolanaWallet(primaryWallet)) {
        console.error('Primary wallet is not a Solana wallet');
        return;
      }

      const newConnection = await primaryWallet.getConnection();
      const signer = await primaryWallet.getSigner();

      const newProvider = new AnchorProvider(
        newConnection,
        {
          publicKey,
          signTransaction: async tx => signer.signTransaction(tx),
          signAllTransactions: async txs => signer.signAllTransactions(txs),
        },
        {
          commitment: 'confirmed',
          skipPreflight: true,
        }
      );

      const newProgram = new Program<YourProgram>(yourProgramIdl, newProvider);

      setConnection(newConnection);
      setProvider(newProvider);
      setProgram(newProgram);
    } catch (error) {
      console.error('Error initializing Anchor provider:', error);
      setConnection(null);
      setProvider(null);
      setProgram(null);
    }
  }, [primaryWallet, sdkHasLoaded, publicKey]);

  useEffect(() => {
    initAnchor();
  }, [initAnchor]);

  const contextValue = useMemo(
    () => ({
      program,
      connection,
      provider,
      publicKey,
    }),
    [program, connection, provider, publicKey]
  );

  return (
    <AnchorProviderContext.Provider value={contextValue}>{children}</AnchorProviderContext.Provider>
  );
}
```

---

## Step 2: Wrap Your App with the Provider

Wrap your app with the `AnchorProviderComponent` so all child components can access the Anchor context.

```tsx
import AnchorProviderComponent from './AnchorProviderComponent';

function App({ children }) {
  return <AnchorProviderComponent>{children}</AnchorProviderComponent>;
}
```

---

## Step 3: Use the Hook in Your Components

You can now access the Anchor context anywhere in your component tree. Here's an example of calling a program method and sending a transaction using the Dynamic wallet:

```tsx
import { useAnchorProvider } from './AnchorProviderComponent';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

function MyComponent() {
  const { program, connection, provider, publicKey } = useAnchorProvider();
  const { primaryWallet } = useDynamicContext();

  // Example: Call a program method and send a transaction
  async function callYourMethod() {
    if (!program || !publicKey || !primaryWallet) return;

    // Build the transaction using Anchor
    const tx = await program.methods
      .yourMethodName()
      .accounts({
        // Add your required accounts here
        user: publicKey,
        // ... other accounts
      })
      .transaction();

    // Get the signer from Dynamic
    const signer = await primaryWallet.getSigner();
    // Sign and send the transaction (type mismatch warning is safe to ignore)
    const result = await signer.signAndSendTransaction(tx);
    // Handle result as needed
  }

  return <div>Connected as: {publicKey?.toBase58() ?? 'Not connected'}</div>;
}
```

---

## Summary

By following this guide, you can connect your Solana Anchor programs to your React or Next.js app using Dynamic for wallet management. This setup enables seamless smart contract interactions and transaction signing, leveraging the strengths of both Anchor and Dynamic.

References:

- [Anchor Documentation](https://www.anchor-lang.com/docs)
- [Quickstart](https://www.dynamic.xyz/docs/quickstart)
- [Example React/Next.js app](https://www.dynamic.xyz/docs/example-apps)
