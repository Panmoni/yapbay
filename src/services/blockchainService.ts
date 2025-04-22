import { ethers } from 'ethers';
// Check which version of ethers we're using
console.log("[DEBUG] Ethers version:", ethers.version || "v6+");
import { config } from '../config';
import YapBayEscrowABI from '../utils/YapBayEscrow.json';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { Address, parseUnits, formatUnits } from 'viem'; // Using viem for types and utils

// Minimal ERC20 ABI for allowance and approve
const erc20Abi = [
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: 'remaining', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: 'success', type: 'bool' }],
    type: 'function',
  },
] as const; // Use 'as const' for better type inference

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
    arbitrator?: string; // Optional parameter for arbitrator address
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
    address: config.contractAddress as Address, // Use Address type from viem
    abi: YapBayEscrowABI.abi
  };

  // Convert amount using viem's parseUnits
  const amountInSmallestUnit = parseUnits(
    params.amount.toString(),
    6 // Assuming USDC with 6 decimals
  );

  // Set default values for optional parameters
  const sequential = params.sequential || false;
  const sequentialEscrowAddress = params.sequentialEscrowAddress || '0x0000000000000000000000000000000000000000' as Address; // Zero address in viem
  // Use provided arbitrator or get from config
  const arbitrator = params.arbitrator ? params.arbitrator as Address : config.arbitratorAddress as Address;

  console.log("[DEBUG] Creating escrow with parameters:", {
    tradeId: BigInt(params.tradeId), // Contract expects BigInt for uint256
    buyer: params.buyer,
    amount: amountInSmallestUnit.toString(),
    sequential,
    sequentialEscrowAddress,
    arbitrator // Include in logs for debugging, but not used in contract call
  });

  try {
    // Call the createEscrow function on the smart contract using the wallet client
    // Note: The arbitrator address is not passed to the contract function
    // It's likely set internally in the contract
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createEscrow',
      args: [
        BigInt(params.tradeId), // Ensure tradeId is BigInt
        params.buyer as Address, // Ensure buyer is Address type
        amountInSmallestUnit,
        sequential,
        sequentialEscrowAddress
      ]
    });

    console.log("[DEBUG] Transaction sent:", hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log("[DEBUG] Transaction confirmed:", receipt);

    // --- Corrected Log Parsing Logic ---
    // 1. Find the relevant log first
    const eventSignature = 'EscrowCreated(uint256,uint256,address,address,address,uint256,uint256,uint256,bool,address,uint256)';
    const eventTopic = ethers.id(eventSignature); // ethers v6 way to get event topic

    const escrowCreatedLog = receipt.logs.find(log =>
        log.address.toLowerCase() === contract.address.toLowerCase() &&
        log.topics[0] === eventTopic
    );

    // 2. Check if the log was found
    if (!escrowCreatedLog) {
        console.error("[ERROR] Raw logs:", receipt.logs);
        throw new Error("EscrowCreated event log not found in transaction receipt");
    }

    // 3. Decode the found log
    let escrowId: string | null = null;
    try {
        const iface = new ethers.Interface(contract.abi);
        const decodedLog = iface.parseLog({ topics: [...escrowCreatedLog.topics], data: escrowCreatedLog.data }); // Spread topics
        if (decodedLog && decodedLog.name === 'EscrowCreated') {
            escrowId = decodedLog.args.escrowId.toString();
        } else {
             throw new Error("Found log, but it was not the EscrowCreated event or decoding failed.");
        }
    } catch (parseError) {
        console.error("[ERROR] Failed to parse EscrowCreated log:", parseError);
        console.error("[ERROR] Log details:", escrowCreatedLog);
        throw new Error("Failed to parse EscrowCreated event log.");
    }


    // 4. Check if escrowId was extracted
    if (escrowId === null) {
         // This case should ideally be caught by the errors above, but added for safety
        throw new Error("EscrowCreated event log found, but escrowId could not be extracted.");
    }

    console.log("[DEBUG] Escrow ID (string):", escrowId);

    // 5. Return the result from the try block
    return {
        escrowId, // Return as string
        txHash: hash,
        blockNumber: receipt.blockNumber
    };
    // --- End Corrected Log Parsing Logic ---

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
  // Use viem's formatUnits and parseUnits
  return formatUnits(
    parseUnits(amount.toString(), decimals),
    decimals
  );
};


/**
 * Checks the token allowance granted by an owner to a spender.
 * @param wallet The Dynamic.xyz wallet object
 * @param tokenAddress The address of the ERC20 token contract
 * @param spenderAddress The address of the spender (e.g., the escrow contract)
 * @param ownerAddress The address of the token owner (optional, defaults to wallet address)
 * @returns The allowance amount as a BigInt.
 */
export const getTokenAllowance = async (
  wallet: any,
  tokenAddress: Address,
  spenderAddress: Address,
  ownerAddress?: Address
): Promise<bigint> => {
  if (!isEthereumWallet(wallet)) {
    throw new Error("Connected wallet is not an Ethereum wallet");
  }
  const publicClient = await wallet.getPublicClient();
  const owner = ownerAddress || wallet.address as Address;

  console.log(`[DEBUG] Checking allowance for owner ${owner} spender ${spenderAddress} on token ${tokenAddress}`);

  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, spenderAddress],
    });
    console.log(`[DEBUG] Allowance: ${allowance.toString()}`);
    return allowance as bigint; // Ensure return type is bigint
  } catch (error) {
    console.error("[ERROR] Failed to get token allowance:", error);
    throw error;
  }
};

/**
 * Approves a spender to spend a certain amount of the owner's tokens.
 * @param wallet The Dynamic.xyz wallet object
 * @param tokenAddress The address of the ERC20 token contract
 * @param spenderAddress The address of the spender (e.g., the escrow contract)
 * @param amount The amount to approve (in the smallest unit, e.g., wei)
 * @returns The transaction hash.
 */
export const approveTokenSpending = async (
  wallet: any,
  tokenAddress: Address,
  spenderAddress: Address,
  amount: bigint
): Promise<string> => {
  if (!isEthereumWallet(wallet)) {
    throw new Error("Connected wallet is not an Ethereum wallet");
  }
  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  console.log(`[DEBUG] Approving ${spenderAddress} to spend ${amount.toString()} tokens from ${wallet.address} on ${tokenAddress}`);

  try {
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spenderAddress, amount],
    });

    console.log("[DEBUG] Approve transaction sent:", hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("[DEBUG] Approve transaction confirmed:", receipt);

    if (receipt.status !== 'success') {
        throw new Error(`Approve transaction failed with status: ${receipt.status}`);
    }

    return hash;
  } catch (error) {
    console.error("[ERROR] Failed to approve token spending:", error);
    throw error;
  }
};


/**
 * Funds an existing escrow on the blockchain.
 * Assumes the caller (seller) has already approved the escrow contract to spend the necessary tokens.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund (as a string or number)
 * @returns The transaction hash.
 */
export const fundEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<string> => {
  if (!isEthereumWallet(wallet)) {
    throw new Error("Connected wallet is not an Ethereum wallet");
  }

  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi
  };

  const escrowIdBigInt = BigInt(escrowId); // Convert escrowId to BigInt for the contract call

  console.log(`[DEBUG] Funding escrow with ID: ${escrowIdBigInt.toString()}`);

  try {
    // Call the fundEscrow function on the smart contract
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'fundEscrow',
      args: [escrowIdBigInt] // Pass escrowId as BigInt
    });

    console.log("[DEBUG] Fund Escrow transaction sent:", hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("[DEBUG] Fund Escrow transaction confirmed:", receipt);

     if (receipt.status !== 'success') {
        throw new Error(`Fund Escrow transaction failed with status: ${receipt.status}`);
    }

    // Optionally, parse logs for 'FundsDeposited' event if needed
    // const fundsDepositedTopic = ethers.id('FundsDeposited(uint256,uint256,uint256,uint256,uint256)');
    // ... log parsing logic similar to createEscrow ...

    return hash;
  } catch (error) {
    console.error(`[ERROR] Failed to fund escrow ${escrowId}:`, error);
    throw error;
  }
};