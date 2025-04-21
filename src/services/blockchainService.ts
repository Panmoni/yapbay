import { ethers } from 'ethers';
// Check which version of ethers we're using
console.log("[DEBUG] Ethers version:", ethers.version || "v6+");
import { config } from '../config';
import YapBayEscrowABI from '../utils/YapBayEscrow.json';
import { isEthereumWallet } from '@dynamic-labs/ethereum';

/**
 * Creates an escrow transaction on the blockchain
 * @param wallet The Dynamic.xyz wallet object
 * @param params Parameters for creating the escrow
 * @returns The transaction result with escrow ID, transaction hash, and block number
 */
export const createEscrowTransaction = async (
  wallet: any,
  params: {
    tradeId: number;
    buyer: string;
    amount: number;
    sequential?: boolean;
    sequentialEscrowAddress?: string;
  }
) => {
  if (!isEthereumWallet(wallet)) {
    throw new Error("Connected wallet is not an Ethereum wallet");
  }

  // Get the wallet client from Dynamic.xyz
  const walletClient = await wallet.getWalletClient();
  
  console.log("[DEBUG] Wallet client:", walletClient);
  console.log("[DEBUG] Wallet address:", wallet.address);
  
  // We'll use the walletClient directly to interact with the contract
  // This is the correct way to use Dynamic.xyz's wallet integration
  
  // Get the public client for reading from the blockchain
  const publicClient = await wallet.getPublicClient();
  
  // Create a contract instance using the wallet client for writing
  const contract = {
    address: config.contractAddress,
    abi: YapBayEscrowABI.abi
  };

  // Convert amount to the appropriate format (e.g., wei for ETH, or the appropriate decimal places for tokens)
  // In ethers v6, parseUnits is directly on the ethers object, not under utils
  const amountInSmallestUnit = ethers.parseUnits(
    params.amount.toString(),
    6  // Assuming USDC with 6 decimals
  );

  // Set default values for optional parameters
  const sequential = params.sequential || false;
  // In ethers v6, constants.AddressZero is replaced with ZeroAddress
  const sequentialEscrowAddress = params.sequentialEscrowAddress || ethers.ZeroAddress;

  console.log("[DEBUG] Creating escrow with parameters:", {
    tradeId: params.tradeId,
    buyer: params.buyer,
    amount: amountInSmallestUnit.toString(),
    sequential,
    sequentialEscrowAddress
  });

  try {
    // Call the createEscrow function on the smart contract using the wallet client
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createEscrow',
      args: [
        params.tradeId,
        params.buyer,
        amountInSmallestUnit,
        sequential,
        sequentialEscrowAddress
      ]
    });

    console.log("[DEBUG] Transaction sent:", hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log("[DEBUG] Transaction confirmed:", receipt);

    // Parse the logs to find the EscrowCreated event and extract the escrow ID
    const escrowCreatedLog = receipt.logs.find(log => {
      return log.address.toLowerCase() === contract.address.toLowerCase();
    });
    
    if (!escrowCreatedLog) {
      throw new Error("EscrowCreated log not found in transaction receipt");
    }
    // Parse the log using ethers.js
    // In ethers v6, Interface is directly on the ethers object, not under utils
    const iface = new ethers.Interface(contract.abi);
    
    const parsedLog = iface.parseLog(escrowCreatedLog);
    
    if (parsedLog.name !== 'EscrowCreated') {
      throw new Error("EscrowCreated event not found in transaction logs");
    }
    
    // Extract the escrow ID (which is a BigInt) and convert it to a simple string
    const escrowIdBigInt = parsedLog.args.escrowId;
    const escrowId = escrowIdBigInt.toString(); // Convert BigInt directly to string "5"
    
    console.log("[DEBUG] Escrow ID (integer string):", escrowId);
    
    return {
      escrowId,
      txHash: hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("[ERROR] Failed to create escrow:", error);
    throw error;
  }
};

/**
 * Utility function to format an amount for display
 * @param amount The amount to format
 * @param decimals The number of decimals
 * @returns The formatted amount
 */
export const formatAmount = (amount: number, decimals: number = 6): string => {
  // In ethers v6, formatUnits and parseUnits are directly on the ethers object, not under utils
  return ethers.formatUnits(
    ethers.parseUnits(amount.toString(), decimals),
    decimals
  );
};