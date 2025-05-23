import { ethers } from 'ethers';
import { config, getNetworkConfig } from '../config';
import YapBayEscrowABI from '../utils/YapBayEscrow.json';
import { Address, parseUnits } from 'viem'; // Using viem for types and utils

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
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  // Get the wallet client from Dynamic.xyz
  const walletClient = await wallet.getWalletClient();

  // console.log("[DEBUG] Wallet client:", walletClient);
  // console.log("[DEBUG] Wallet address:", wallet.address);

  // We'll use the walletClient directly to interact with the contract
  // This is the correct way to use Dynamic.xyz's wallet integration

  // Get the public client for reading from the blockchain
  const publicClient = await wallet.getPublicClient();

  // Create a contract instance using the wallet client for writing
  const contract = {
    address: config.contractAddress as Address, // Use Address type from viem
    abi: YapBayEscrowABI.abi,
  };

  // Convert amount using viem's parseUnits
  const amountInSmallestUnit = parseUnits(
    params.amount.toString(),
    6 // Assuming USDC with 6 decimals
  );

  // Set default values for optional parameters
  const sequential = params.sequential || false;
  const sequentialEscrowAddress =
    params.sequentialEscrowAddress || ('0x0000000000000000000000000000000000000000' as Address); // Zero address in viem
  // Use provided arbitrator or get from config
  const arbitrator = params.arbitrator
    ? (params.arbitrator as Address)
    : (config.arbitratorAddress as Address);

  console.log('[DEBUG] Creating escrow with parameters:', {
    tradeId: BigInt(params.tradeId), // Contract expects BigInt for uint256
    buyer: params.buyer,
    amount: amountInSmallestUnit.toString(),
    sequential,
    sequentialEscrowAddress,
    arbitrator, // Include in logs for debugging, but not used in contract call
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
        sequentialEscrowAddress,
      ],
    });

    console.log('[DEBUG] Transaction sent:', hash);

    try {
      // Wait for the transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      console.log('[DEBUG] Transaction confirmed:', receipt);

      // --- Corrected Log Parsing Logic ---
      // 1. Find the relevant log first
      const eventSignature =
        'EscrowCreated(uint256,uint256,address,address,address,uint256,uint256,uint256,bool,address,uint256)';
      const eventTopic = ethers.id(eventSignature); // ethers v6 way to get event topic

      const escrowCreatedLog = receipt.logs.find(
        (log: any) =>
          log.address.toLowerCase() === contract.address.toLowerCase() &&
          log.topics[0] === eventTopic
      );

      // 2. Check if the log was found
      if (!escrowCreatedLog) {
        console.error('[ERROR] Raw logs:', receipt.logs);
        throw new Error('EscrowCreated event log not found in transaction receipt');
      }

      // 3. Decode the found log
      let escrowId: string | null = null;
      try {
        const iface = new ethers.Interface(contract.abi);
        const decodedLog = iface.parseLog({
          topics: [...escrowCreatedLog.topics],
          data: escrowCreatedLog.data,
        }); // Spread topics
        if (decodedLog && decodedLog.name === 'EscrowCreated') {
          escrowId = decodedLog.args.escrowId.toString();
        } else {
          throw new Error('Found log, but it was not the EscrowCreated event or decoding failed.');
        }
      } catch (parseError) {
        console.error('[ERROR] Failed to parse EscrowCreated log:', parseError);
        console.error('[ERROR] Log details:', escrowCreatedLog);
        throw new Error('Failed to parse EscrowCreated event log.');
      }

      // 4. Check if escrowId was extracted
      if (escrowId === null) {
        // This case should ideally be caught by the errors above, but added for safety
        throw new Error('EscrowCreated event log found, but escrowId could not be extracted.');
      }

      console.log('[DEBUG] Escrow ID (string):', escrowId);

      // 5. Return the result from the try block
      return {
        escrowId, // Return as string
        txHash: hash,
        blockNumber: receipt.blockNumber,
      };
      // --- End Corrected Log Parsing Logic ---
    } catch (receiptError: any) {
      // Check for specific block out of range error
      if (
        (receiptError.message && receiptError.message.includes('block is out of range')) ||
        (receiptError.details &&
          typeof receiptError.details === 'string' &&
          receiptError.details.includes('block is out of range'))
      ) {
        console.warn(
          '[WARNING] Block out of range error. Transaction may still be processing:',
          hash
        );

        // Return partial result with txHash but mark as pending
        return {
          txHash: hash,
          blockNumber: BigInt(0), // Use 0 to indicate pending
          escrowId: '0', // Will be updated later
          status: 'PENDING',
        };
      }

      // Re-throw other errors
      console.error('[ERROR] Failed to get transaction receipt:', receiptError);
      throw receiptError;
    }
  } catch (error) {
    console.error('[ERROR] Failed to create escrow:', error);
    throw error;
  }
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
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }
  const publicClient = await wallet.getPublicClient();
  const owner = ownerAddress || (wallet.address as Address);

  // console.log(`[DEBUG] Checking allowance for owner ${owner} spender ${spenderAddress} on token ${tokenAddress}`);

  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, spenderAddress],
    });
    // console.log(`[DEBUG] Allowance: ${allowance.toString()}`);
    return allowance as bigint; // Ensure return type is bigint
  } catch (error) {
    console.error('[ERROR] Failed to get token allowance:', error);
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
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }
  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  console.log(
    `[DEBUG] Approving ${spenderAddress} to spend ${amount.toString()} tokens from ${
      wallet.address
    } on ${tokenAddress}`
  );

  try {
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spenderAddress, amount],
    });

    console.log('[DEBUG] Approve transaction sent:', hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('[DEBUG] Approve transaction confirmed:', receipt);

    if (receipt.status !== 'success') {
      throw new Error(`Approve transaction failed with status: ${receipt.status}`);
    }

    return hash;
  } catch (error) {
    console.error('[ERROR] Failed to approve token spending:', error);
    throw error;
  }
};

/**
 * Funds an existing escrow on the blockchain.
 * Assumes the caller (seller) has already approved the escrow contract to spend the necessary tokens.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund (as a string or number)
 * @returns The transaction result with txHash and blockNumber.
 */
export const fundEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<{ txHash: string; blockNumber: bigint }> => {
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi,
  };

  const escrowIdBigInt = BigInt(escrowId); // Convert escrowId to BigInt for the contract call

  console.log(
    `[DEBUG] Funding escrow with ID: ${escrowIdBigInt.toString()} (as string to avoid serialization issues)`
  );
  console.log(
    `[DEBUG] Full transaction details: Escrow ID: ${escrowIdBigInt.toString()}, Wallet: ${
      wallet.address
    }, Contract: ${config.contractAddress}`
  );

  try {
    // Call the fundEscrow function on the smart contract
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'fundEscrow',
      args: [escrowIdBigInt], // Pass escrowId as BigInt
    });

    console.log(
      '[DEBUG] Fund Escrow transaction sent:',
      hash,
      ' - Escrow ID: ',
      escrowIdBigInt.toString()
    );

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      '[DEBUG] Fund Escrow transaction confirmed:',
      JSON.stringify(receipt, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );

    if (receipt.status !== 'success') {
      throw new Error(`Fund Escrow transaction failed with status: ${receipt.status}`);
    }

    // Optionally, parse logs for 'FundsDeposited' event if needed
    // const fundsDepositedTopic = ethers.id('FundsDeposited(uint256,uint256,uint256,uint256,uint256)');
    // ... log parsing logic similar to createEscrow ...

    return {
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error(
      `[ERROR] Failed to fund escrow ${escrowId}:`,
      error,
      ' - Error details: ',
      JSON.stringify(error, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    throw error;
  }
};

/**
 * Helper function to check if an escrow needs funding and fund it if necessary.
 * This handles the token approval and funding in one function.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to fund
 * @param amount The amount to fund (in the smallest unit, e.g., wei)
 * @returns The transaction hash of the funding transaction.
 */
export const checkAndFundEscrow = async (
  wallet: any,
  escrowId: string | number
): Promise<string> => {
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  const tokenAddress = config.usdcAddressAlfajores as Address;
  const escrowContractAddress = config.contractAddress as Address;

  // Check allowance
  const currentAllowance = await getTokenAllowance(wallet, tokenAddress, escrowContractAddress);

  // Approve token spending if needed
  // Enforce a fixed spending allowance of 100 USDC
  const fixedAllowance = parseUnits('100', 6); // Fixed at 100 USDC with 6 decimals
  if (currentAllowance < fixedAllowance) {
    // console.log(`[DEBUG] Approving fixed token spending: ${fixedAllowance.toString()} (100 USDC)`);
    await approveTokenSpending(wallet, tokenAddress, escrowContractAddress, fixedAllowance);
  } else {
    console.log('[DEBUG] Token spending already approved');
  }

  // Fund the escrow
  return fundEscrowTransaction(wallet, escrowId).then(result => result.txHash);
};

/**
 * Marks the fiat payment as paid for an escrow on the blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to mark as paid (as a string or number)
 * @returns The transaction hash.
 */
export const markFiatPaidTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<string> => {
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi,
  };

  const escrowIdBigInt = BigInt(escrowId); // Convert escrowId to BigInt for the contract call

  console.log(`[DEBUG] Marking fiat as paid for escrow with ID: ${escrowIdBigInt.toString()}`);
  console.log(
    `[DEBUG] Full transaction details: Escrow ID: ${escrowIdBigInt.toString()}, Wallet: ${
      wallet.address
    }, Contract: ${config.contractAddress}`
  );

  try {
    // Call the markFiatPaid function on the smart contract
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'markFiatPaid',
      args: [escrowIdBigInt], // Pass escrowId as BigInt
    });

    console.log(
      '[DEBUG] Mark Fiat Paid transaction sent:',
      hash,
      ' - Escrow ID: ',
      escrowIdBigInt.toString()
    );

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      '[DEBUG] Mark Fiat Paid transaction confirmed:',
      JSON.stringify(receipt, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );

    if (receipt.status !== 'success') {
      throw new Error(`Mark Fiat Paid transaction failed with status: ${receipt.status}`);
    }

    // Optionally, parse logs for 'FiatMarkedPaid' event if needed
    // const fiatMarkedPaidTopic = ethers.id('FiatMarkedPaid(uint256,uint256,uint256)');
    // ... log parsing logic similar to createEscrow ...

    return hash;
  } catch (error) {
    console.error(
      `[ERROR] Failed to mark fiat as paid for escrow ${escrowId}:`,
      error,
      ' - Error details: ',
      JSON.stringify(error, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    throw error;
  }
};

/**
 * Releases an escrow on the blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to release
 * @returns The transaction hash and block number
 */
export const releaseEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<{ txHash: string; blockNumber: bigint }> => {
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi,
  };

  try {
    console.log(`[DEBUG] Releasing escrow with ID: ${escrowId}`);

    // First check the escrow state to make sure it can be released
    const escrowState = await checkEscrowState(wallet, escrowId);

    // Check if the escrow is in a releasable state
    // Based on the contract:
    // State 0 = Created, State 1 = Funded, State 2 = Released, etc.
    // The contract requires state to be Funded (1) and fiatPaid to be true
    if (escrowState.state !== 1) {
      throw new Error(
        `Cannot release escrow in state ${escrowState.state}. Escrow must be in FUNDED state (1).`
      );
    }

    if (!escrowState.fiatPaid) {
      throw new Error(
        `Cannot release escrow with fiatPaid=false. The fiat payment must be confirmed first.`
      );
    }

    // Check if the escrow has funds
    if (!escrowState.hasFunds) {
      throw new Error('Cannot release escrow with no funds.');
    }

    // Send the transaction
    const hash = await walletClient.writeContract({
      ...contract,
      functionName: 'releaseEscrow',
      args: [BigInt(escrowId)],
    });

    console.log(`[DEBUG] Release escrow transaction sent: ${hash}`);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('[DEBUG] Release escrow transaction confirmed:', receipt);

    // Check the transaction status
    if (receipt.status !== 'success') {
      console.error('[ERROR] Release escrow transaction failed:', receipt);

      // Try to get more detailed error information
      try {
        // Simulate the transaction to get the revert reason
        const simulationResult = await publicClient.simulateContract({
          address: contract.address,
          abi: contract.abi,
          functionName: 'releaseEscrow',
          args: [BigInt(escrowId)],
          account: walletClient.account,
        });

        console.error('[ERROR] Simulation result:', simulationResult);
      } catch (simulationError: any) {
        console.error(
          '[ERROR] Transaction simulation error details:',
          simulationError.message,
          simulationError.cause,
          simulationError.details,
          JSON.stringify(simulationError, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value
          )
        );

        // Extract the revert reason if available
        let revertReason = 'Unknown reason';
        if (simulationError.message) {
          if (simulationError.message.includes('execution reverted:')) {
            revertReason = simulationError.message.split('execution reverted:')[1].trim();
          } else if (simulationError.message.includes('revert')) {
            revertReason = simulationError.message;
          }
        }

        throw new Error(`Release escrow transaction reverted: ${revertReason}`);
      }

      throw new Error(`Release escrow transaction failed with status: ${receipt.status}`);
    }

    // Check for the EscrowReleased event in the logs
    // The event signature is: EscrowReleased(uint256 indexed escrowId, uint256 indexed tradeId, address buyer, uint256 amount, uint256 counter, uint256 timestamp, string destination)
    // Parse the transaction logs to find the EscrowReleased event
    const contractLogs = receipt.logs.filter(
      (log: any) => log.address.toLowerCase() === contract.address.toLowerCase()
    );
    console.log(`[DEBUG] Found ${contractLogs.length} logs from the contract in this transaction`);
    if (contractLogs.length === 0) {
      console.warn('[WARNING] No logs found from the escrow contract in this transaction');
    } else {
      // Check if any of the logs contain the EscrowReleased event
      const escrowReleasedEvent = contractLogs.find((log: any) => {
        try {
          const decodedLog = publicClient.decodeEventLog({
            abi: contract.abi,
            data: log.data,
            topics: log.topics,
          });
          return decodedLog.eventName === 'EscrowReleased';
        } catch {
          // Ignore decoding errors and continue
          return false;
        }
      });

      if (escrowReleasedEvent) {
        console.log('[DEBUG] Found EscrowReleased event in transaction logs');
        // If we found the event, we can be more confident the release succeeded
      } else {
        console.warn('[WARNING] No EscrowReleased event found in transaction logs');
      }
    }

    // Add initial delay before first state check to allow RPC node to sync
    console.log('[DEBUG] Waiting for blockchain state to synchronize...');
    await delay(2000);

    // Implement retry logic for state verification
    let postReleaseState;
    let retries = 3; // Number of retry attempts
    let success = false;

    while (retries > 0 && !success) {
      // Get the current retry attempt number (4-retries gives us 1, 2, 3)
      const attemptNumber = 4 - retries;

      // Add increasing delay between retries
      if (attemptNumber > 1) {
        const waitTime = 2000 * attemptNumber; // 2s, 4s, 6s
        console.log(`[DEBUG] Retry attempt ${attemptNumber}: Waiting ${waitTime / 1000}s before checking state...`);
        await delay(waitTime);
      }

      // Check the escrow state
      postReleaseState = await checkEscrowState(wallet, escrowId);
      console.log(`[DEBUG] Post-release escrow state (attempt ${attemptNumber}): ${postReleaseState.state}, amount: ${postReleaseState.amount.toString()}`);

      if (postReleaseState.state === 2) {
        // RELEASED (2)
        success = true;
        break;
      }

      retries--;
    }

    if (!success) {
      // If we have the EscrowReleased event but state check fails, log a warning but don't throw
      const hasReleaseEvent = contractLogs.some((log: any) => {
        try {
          const decodedLog = publicClient.decodeEventLog({
            abi: contract.abi,
            data: log.data,
            topics: log.topics,
          });
          return decodedLog.eventName === 'EscrowReleased';
        } catch {
          // Ignore decoding errors and continue
          return false;
        }
      });

      if (hasReleaseEvent) {
        console.warn(`[WARNING] Escrow state check failed but EscrowReleased event was found. The transaction likely succeeded but the RPC node may be out of sync. Current state: ${postReleaseState ? postReleaseState.state : 'unknown'}, expected: 2 (RELEASED)`);
        // Proceed as if successful since we have the event
      } else {
        console.error(`[ERROR] Escrow state after release is ${postReleaseState ? postReleaseState.state : 'unknown'}, expected 2 (RELEASED)`);
        throw new Error(`Escrow state transition failed. Current state: ${postReleaseState ? postReleaseState.state : 'unknown'}, expected: 2 (RELEASED)`);
      }
    }

    // Verify the escrow state is RELEASED (2)
    try {
      // The proper way to check if an escrow is released is to verify its state
      // We've already done this in the retry logic above, but let's double-check
      
      if (postReleaseState && postReleaseState.state === 2) {
        // State 2 is RELEASED, which means the release was successful
        console.log('[DEBUG] Escrow state is RELEASED (2), confirming successful release');
      } else {
        // If the state is not RELEASED, something went wrong
        console.error(`[ERROR] Escrow state after release is ${postReleaseState ? postReleaseState.state : 'unknown'}, expected 2 (RELEASED)`);
        throw new Error(`Escrow state transition failed. Current state: ${postReleaseState ? postReleaseState.state : 'unknown'}, expected: 2 (RELEASED)`);
      }
    } catch (balanceError) {
      console.error('[ERROR] Failed to check escrow state:', balanceError);
      throw balanceError;
    }

    return {
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error(
      `[ERROR] Failed to release escrow ${escrowId}:`,
      error,
      ' - Error details: ',
      JSON.stringify(error, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    throw error;
  }
};

/**
 * Opens a dispute for an escrow on the blockchain.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to dispute
 * @param evidenceHash The hash of the evidence for the dispute (bytes32)
 * @returns The transaction hash and block number
 */
export const disputeEscrowTransaction = async (
  wallet: any,
  escrowId: string | number,
  evidenceHash: string
): Promise<{ txHash: string; blockNumber: bigint }> => {
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi,
  };

  const escrowIdBigInt = BigInt(escrowId);

  console.log(`[DEBUG] Opening dispute for escrow with ID: ${escrowIdBigInt.toString()}`);

  try {
    // Call the openDisputeWithBond function on the smart contract
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'openDisputeWithBond',
      args: [escrowIdBigInt, evidenceHash],
    });

    console.log('[DEBUG] Dispute escrow transaction sent:', hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      '[DEBUG] Dispute escrow transaction confirmed:',
      JSON.stringify(receipt, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );

    if (receipt.status !== 'success') {
      throw new Error(`Dispute escrow transaction failed with status: ${receipt.status}`);
    }

    return {
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error(
      `[ERROR] Failed to dispute escrow ${escrowId}:`,
      error,
      ' - Error details: ',
      JSON.stringify(error, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    throw error;
  }
};

/**
 * Helper function to add a delay
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches the USDC balance for a given wallet address using the appropriate network configuration.
 * @param address Wallet address (string)
 * @param chainId Network chain ID (optional, defaults to testnet)
 * @returns Promise<BigInt> USDC balance (in smallest unit, e.g. 6 decimals)
 */
export async function getUsdcBalance(address: string, chainId?: number): Promise<bigint> {
  // Default to testnet if no chainId provided
  const networkConfig = chainId ? getNetworkConfig(chainId) : config.networks.testnet;
  
  // Use ethers.js for direct RPC call
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const usdcAddress = networkConfig.usdcAddress;
  
  // Minimal ERC20 ABI for balanceOf
  const erc20BalanceOfAbi = [
    {
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
    },
  ];
  const contract = new ethers.Contract(usdcAddress, erc20BalanceOfAbi, provider);
  const balance: bigint = await contract.balanceOf(address);
  return balance;
}

/**
 * Checks the state and funds of an escrow.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to check
 * @returns Object containing state and amount information
 */
export const checkEscrowState = async (
  wallet: any,
  escrowId: string | number
): Promise<{ state: number; amount: bigint; hasFunds: boolean; fiatPaid: boolean }> => {
  if (!wallet.getPublicClient) {
    throw new Error('Wallet must implement getPublicClient');
  }

  const publicClient = await wallet.getPublicClient();
  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi,
  };

  const escrowIdBigInt = BigInt(escrowId);

  try {
    // Get the escrow data from the escrows mapping
    const escrowData = await publicClient.readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'escrows',
      args: [escrowIdBigInt],
    });

    // The escrow data structure depends on the contract implementation
    // State is at index 8 based on queryEscrowBalances.ts
    const state = Number(escrowData[8]); // EscrowState enum value
    const amount = escrowData[5] as bigint; // Amount in the escrow
    const fiatPaid = Boolean(escrowData[11]); // fiat_paid flag at index 11

    console.log(
      `[DEBUG] Escrow ${escrowId} state: ${state}, amount: ${amount.toString()}, fiatPaid: ${fiatPaid}`
    );

    // If amount is greater than 0, the escrow has funds
    const hasFunds = amount > BigInt(0);

    return { state, amount, hasFunds, fiatPaid };
  } catch (error) {
    console.error(
      `[ERROR] Failed to check escrow state for ${escrowId}:`,
      error,
      ' - Error details: ',
      JSON.stringify(error, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    throw error;
  }
};

/**
 * Cancels an escrow on the blockchain.
 * First checks if the escrow has funds and prevents cancellation if it does.
 * @param wallet The Dynamic.xyz wallet object
 * @param escrowId The ID of the escrow to cancel
 * @returns The transaction hash and block number
 */
export const cancelEscrowTransaction = async (
  wallet: any,
  escrowId: string | number
): Promise<{ txHash: string; blockNumber: bigint }> => {
  if (!wallet.getWalletClient || !wallet.getPublicClient) {
    throw new Error('Wallet must implement getWalletClient and getPublicClient');
  }

  // First check if the escrow has funds
  const { hasFunds } = await checkEscrowState(wallet, escrowId);
  if (hasFunds) {
    throw new Error(
      'Cannot cancel an escrow that still has funds. The funds must be released first.'
    );
  }

  const walletClient = await wallet.getWalletClient();
  const publicClient = await wallet.getPublicClient();

  const contract = {
    address: config.contractAddress as Address,
    abi: YapBayEscrowABI.abi,
  };

  const escrowIdBigInt = BigInt(escrowId);

  console.log(`[DEBUG] Cancelling escrow with ID: ${escrowIdBigInt.toString()}`);

  try {
    // Call the cancelEscrow function on the smart contract
    const hash = await walletClient.writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'cancelEscrow',
      args: [escrowIdBigInt],
    });

    console.log('[DEBUG] Cancel escrow transaction sent:', hash);

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      '[DEBUG] Cancel escrow transaction confirmed:',
      JSON.stringify(receipt, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );

    if (receipt.status !== 'success') {
      throw new Error(`Cancel escrow transaction failed with status: ${receipt.status}`);
    }

    return {
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error(
      `[ERROR] Failed to cancel escrow ${escrowId}:`,
      error,
      ' - Error details: ',
      JSON.stringify(error, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
    );
    throw error;
  }
};
