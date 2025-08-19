import React, { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { encodeFunctionData, WalletClient as ViemWalletClient, PublicClient as ViemPublicClient, TransactionReceipt, Chain } from 'viem';
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import { toast } from 'sonner';
import { config } from '../config'; // Adjusted path
import YapBayEscrowABI from '../utils/YapBayEscrow.json'; // Adjusted path

// Define Celo Mainnet configuration according to Viem's Chain interface
const celoMainnet: Chain = {
  id: 42220,
  name: 'Celo Mainnet',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] }, // Default Celo RPC
    public: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'CeloScan', url: 'https://celoscan.io' },
  },
  testnet: false,
};

const ManualDivviReferral: React.FC = () => {
  const { primaryWallet, user, setShowAuthFlow } = useDynamicContext();

  const [tradeId, setTradeId] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>(''); // Representing USDC amount, e.g., "10.5"
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // State for verification
  const [divviRegistryAddress, setDivviRegistryAddress] = useState<string>('');
  const [lastTxContext, setLastTxContext] = useState<{ txHash: string; blockNumber: bigint; userAddress: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');

  const VITE_DIVVI_CONSUMER_ID = import.meta.env.VITE_DIVVI_CONSUMER_ID;
  const VITE_DIVVI_PROVIDERS_LIST_STR = import.meta.env.VITE_DIVVI_PROVIDERS_LIST;

  useEffect(() => {
    if (!VITE_DIVVI_CONSUMER_ID || !VITE_DIVVI_PROVIDERS_LIST_STR) {
      toast.error('Divvi environment variables are not set. Please check your .env file.');
      console.error('Divvi environment variables VITE_DIVVI_CONSUMER_ID or VITE_DIVVI_PROVIDERS_LIST are missing.');
    }
  }, [VITE_DIVVI_CONSUMER_ID, VITE_DIVVI_PROVIDERS_LIST_STR]);

  const handleCreateEscrowAndRefer = async () => {
    setIsLoading(true);
    setStatusMessage('Starting process...');

    if (!VITE_DIVVI_CONSUMER_ID || !VITE_DIVVI_PROVIDERS_LIST_STR) {
      toast.error('Divvi environment variables missing.');
      setIsLoading(false);
      return;
    }

    if (!primaryWallet || !user) {
      toast.error('Please connect your wallet first.');
      setShowAuthFlow(true);
      setIsLoading(false);
      return;
    }

    if (!tradeId || !buyerAddress || !amount) {
      toast.error('Please fill in all fields: Trade ID, Buyer Address, and Amount.');
      setIsLoading(false);
      return;
    }

    let viemWalletClient: ViemWalletClient | null = null;
    let viemPublicClient: ViemPublicClient | null = null;

    try {
      setStatusMessage('Initializing wallet client...');

      // Check if primaryWallet and the expected methods exist, similar to useTradeActions.ts
      if (primaryWallet &&
          typeof (primaryWallet as any).getWalletClient === 'function' &&
          typeof (primaryWallet as any).getPublicClient === 'function') {
        
        // Linter might still complain here if the base type doesn't list them,
        // so we use 'as any' to reflect the runtime assumption based on other working code.
        const pwAsRuntimeWallet = primaryWallet as any;
        viemWalletClient = await pwAsRuntimeWallet.getWalletClient();
        viemPublicClient = await pwAsRuntimeWallet.getPublicClient();

      } else {
        // This error message now points to a more fundamental issue if this path is hit,
        // suggesting that the assumption about primaryWallet (based on chainService/tradeService)
        // is incorrect, or Dynamic setup is incomplete for these methods to be available.
        throw new Error('Primary wallet does not have getWalletClient/getPublicClient methods. This might indicate an issue with your Dynamic SDK setup or the wallet connector itself not providing these viem-compatible clients as expected by other parts of your application (e.g., chainService.ts).');
      }

      if (!viemWalletClient || !viemPublicClient) {
        throw new Error('Failed to initialize Viem clients from primary wallet.');
      }

      const connectedChainId = await viemWalletClient.getChainId();
      if (connectedChainId !== celoMainnet.id) {
        toast.error(`Please switch your wallet to Celo Mainnet (Expected: ${celoMainnet.id}, Found: ${connectedChainId}).`);
        setIsLoading(false);
        return;
      }
      console.log('Connected Chain ID:', connectedChainId);

      setStatusMessage('Generating Divvi data suffix...');
      const providers = VITE_DIVVI_PROVIDERS_LIST_STR.split(',').map((p: string) => p.trim()).filter((p: string) => p.startsWith('0x'));
      if (providers.length === 0) {
        throw new Error('No valid provider addresses found in VITE_DIVVI_PROVIDERS_LIST.');
      }
      const dataSuffix = getDataSuffix({
        consumer: VITE_DIVVI_CONSUMER_ID as `0x${string}`, // Cast if sure it's hex
        providers: providers as [`0x${string}`, ...`0x${string}`[]], // Ensure it's a non-empty array of hex strings
      });
      console.log('Divvi dataSuffix:', dataSuffix);

      setStatusMessage('Preparing transaction data...');
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount entered.');
      }
      // Assuming USDC with 6 decimals, adjust if different
      const amountInSmallestUnit = BigInt(Math.floor(parsedAmount * 10**6));

      const rawContractCallData = encodeFunctionData({
        abi: YapBayEscrowABI.abi,
        functionName: 'createEscrow',
        args: [
          BigInt(tradeId),
          buyerAddress as `0x${string}`, // Cast to Address
          amountInSmallestUnit,
          false, // _sequential
          '0x0000000000000000000000000000000000000000' as `0x${string}` // _sequentialEscrowAddress (zero address)
        ],
      });
      
      // Remove '0x' from dataSuffix if it's present, as rawContractCallData is already a hex string.
      const finalTxData = rawContractCallData + (dataSuffix.startsWith('0x') ? dataSuffix.substring(2) : dataSuffix);
      console.log('Final transaction data:', finalTxData);

      setStatusMessage('Sending transaction...');
      const txHash = await viemWalletClient.sendTransaction({
        account: primaryWallet.address as `0x${string}`,
        to: config.contractAddress as `0x${string}`, // Your escrow contract address from config
        data: finalTxData as `0x${string}`,
        chain: celoMainnet, // Explicitly pass Celo mainnet chain object
        // value: 0n, // If no ETH is sent directly
      });
      console.log('Transaction hash:', txHash);
      toast.info('Transaction sent! Waiting for confirmation...', { description: `Hash: ${txHash}` });

      setStatusMessage('Waiting for transaction confirmation...');
      const receipt: TransactionReceipt = await viemPublicClient.waitForTransactionReceipt({ hash: txHash });

      if (receipt.status !== 'success') {
        throw new Error(`Transaction failed with status: ${receipt.status}. Hash: ${txHash}`);
      }
      console.log('Transaction confirmed. Receipt:', receipt);
      toast.success('Transaction confirmed!', { description: `Block: ${receipt.blockNumber}`});

      setStatusMessage('Submitting referral to Divvi...');
      const submissionChainId = await viemWalletClient.getChainId(); // Or use receipt.chainId if available and correct
      await submitReferral({ txHash, chainId: submissionChainId });
      console.log('Referral submitted to Divvi.');
      toast.success('Referral successfully submitted to Divvi!');
      setStatusMessage(`Referral for ${user.email || primaryWallet.address} registered with tx ${txHash}!`);

      // Store context for verification
      setLastTxContext({ 
        txHash: txHash as string, 
        blockNumber: receipt.blockNumber, 
        userAddress: primaryWallet.address as string 
      });
      setVerificationMessage(''); // Clear previous verification message

    } catch (error) {
      console.error('Error during Divvi referral process:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('Error', { description: errorMessage });
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyReferral = async () => {
    if (!lastTxContext) {
      toast.error('Please submit a referral transaction first.');
      return;
    }
    if (!divviRegistryAddress || !divviRegistryAddress.startsWith('0x')) {
      toast.error('Please enter a valid DivviRegistry contract address.');
      return;
    }
    if (!VITE_DIVVI_CONSUMER_ID) {
      toast.error('Divvi Consumer ID is not set in environment variables.');
      return;
    }

    setIsVerifying(true);
    setVerificationMessage('Verifying referral on DivviRegistry...');

    let viemPublicClient: ViemPublicClient | null = null;

    try {
      if (primaryWallet && typeof (primaryWallet as any).getPublicClient === 'function') {
        const pwAsRuntimeWallet = primaryWallet as any;
        viemPublicClient = await pwAsRuntimeWallet.getPublicClient();
      } else {
        throw new Error('Could not get Public Client from wallet.');
      }

      if (!viemPublicClient) {
        throw new Error('Failed to initialize Viem Public Client.');
      }
      
      // Define the ReferralRegistered event ABI (ensure this matches Divvi's actual ABI)
      const referralRegisteredEventAbi = [
        {
          "anonymous": false,
          "inputs": [
            { "indexed": true, "internalType": "address", "name": "provider", "type": "address" },
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" }, // topic2
            { "indexed": true, "internalType": "address", "name": "rewardsConsumer", "type": "address" }, // topic3
            { "indexed": false, "internalType": "bytes", "name": "metadata", "type": "bytes" }
          ],
          "name": "ReferralRegistered",
          "type": "event"
        }
      ] as const; // Use 'as const' for better type inference with Viem

      console.log(`Querying DivviRegistry (${divviRegistryAddress}) for ReferralRegistered event...`);
      console.log(`  rewardsConsumer (topic3): ${VITE_DIVVI_CONSUMER_ID}`);
      console.log(`  user (topic2): ${lastTxContext.userAddress}`);
      console.log(`  fromBlock: ${lastTxContext.blockNumber.toString()}, toBlock: ${lastTxContext.blockNumber.toString()}`);

      const logs = await viemPublicClient.getLogs({
        address: divviRegistryAddress as `0x${string}`,
        event: referralRegisteredEventAbi[0], // Pass the event ABI directly
        args: {
          // Filter by indexed parameters. Names must match 'name' in ABI.
          rewardsConsumer: VITE_DIVVI_CONSUMER_ID as `0x${string}`,
          user: lastTxContext.userAddress as `0x${string}`
        },
        fromBlock: lastTxContext.blockNumber,
        toBlock: lastTxContext.blockNumber, // Check only the block where our transaction was confirmed
      });

      if (logs.length > 0) {
        console.log('Found logs:', logs);
        // Potentially further inspect logs[0].args if needed
        setVerificationMessage(`Success! Found ${logs.length} ReferralRegistered event(s) for consumer ${VITE_DIVVI_CONSUMER_ID} and user ${lastTxContext.userAddress} in block ${lastTxContext.blockNumber}.`);
        toast.success('Referral verified!');
      } else {
        setVerificationMessage(`No ReferralRegistered event found for consumer ${VITE_DIVVI_CONSUMER_ID} and user ${lastTxContext.userAddress} in block ${lastTxContext.blockNumber}. The transaction might be valid, but Divvi may not have processed it yet, or the DivviRegistry address/event details are incorrect.`);
        toast.info('Referral event not found in that block.');
      }

    } catch (error) {
      console.error('Error verifying referral:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setVerificationMessage(`Error: ${errorMessage}`);
      toast.error('Verification Error', { description: errorMessage });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '40px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Manual Divvi Referral Registration</h2>
      <p>This page allows you to manually perform a `createEscrow` transaction with Divvi referral data appended.</p>
      <p>Ensure your wallet is connected to the correct network (e.g., Sepolia testnet) where your Escrow contract is deployed.</p>
      
      {!VITE_DIVVI_CONSUMER_ID || !VITE_DIVVI_PROVIDERS_LIST_STR ? (
        <p style={{color: 'red'}}><strong>Warning:</strong> Divvi environment variables not configured. Check console.</p>
      ) : (
        <p style={{color: 'green'}}>Divvi ENV Vars loaded.</p>
      )}

      <hr style={{ margin: '20px 0' }} />

      {primaryWallet ? (
        <div>
          <p><strong>Wallet Connected:</strong> {primaryWallet.address}</p>
          <p><strong>User:</strong> {user?.email || 'N/A'}</p>
        </div>
      ) : (
        <button onClick={() => setShowAuthFlow(true)} disabled={isLoading}>
          Connect Wallet
        </button>
      )}

      <hr style={{ margin: '20px 0' }} />

      {primaryWallet && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="tradeId" style={{ display: 'block', marginBottom: '5px' }}>Trade ID (number, e.g., 123):</label>
            <input
              type="number"
              id="tradeId"
              value={tradeId}
              onChange={(e) => setTradeId(e.target.value)}
              placeholder="e.g., 123"
              disabled={isLoading}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="buyerAddress" style={{ display: 'block', marginBottom: '5px' }}>Buyer Address (0x...):</label>
            <input
              type="text"
              id="buyerAddress"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="e.g., 0x123..."
              disabled={isLoading}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '5px' }}>Amount (USDC, e.g., 10.50):</label>
            <input
              type="text" // Using text for easier input of decimals
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 10.50"
              disabled={isLoading}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          <button onClick={handleCreateEscrowAndRefer} disabled={isLoading} style={{ padding: '10px 15px', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? 'Processing...' : 'Create Escrow & Register Divvi Referral'}
          </button>
        </div>
      )}

      {statusMessage && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', background: isLoading ? '#f0f0f0' : '#e6ffed' }}>
          <p><strong>Status:</strong> {statusMessage}</p>
        </div>
      )}

      {/* Verification Section */}
      {lastTxContext && (
        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
          <h4>Verify Last Referral</h4>
          <p>To verify the last referral (Tx: {lastTxContext.txHash.substring(0,10)}... in Block: {lastTxContext.blockNumber.toString()}), please provide the DivviRegistry contract address for Celo Mainnet.</p>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="divviRegistryAddress" style={{ display: 'block', marginBottom: '5px' }}>DivviRegistry Contract Address:</label>
            <input
              type="text"
              id="divviRegistryAddress"
              value={divviRegistryAddress}
              onChange={(e) => setDivviRegistryAddress(e.target.value)}
              placeholder="0x... (DivviRegistry on Celo Mainnet)"
              disabled={isVerifying}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={handleVerifyReferral} disabled={isVerifying || isLoading} style={{ padding: '10px 15px', cursor: (isVerifying || isLoading) ? 'not-allowed' : 'pointer' }}>
            {isVerifying ? 'Verifying...' : 'Verify Referral on DivviRegistry'}
          </button>
          {verificationMessage && (
            <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', background: isVerifying ? '#f0f0f0' : (verificationMessage.startsWith('Success') ? '#e6ffed' : '#ffebeb') }}>
              <p><strong>Verification Status:</strong> {verificationMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManualDivviReferral; 