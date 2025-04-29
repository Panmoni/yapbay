// scripts/queryEscrowBalances.ts
// npx ts-node scripts/queryEscrowBalances.ts

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Load ABI using fs (ES Module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const abiPath = path.resolve(__dirname, '../src/utils/YapBayEscrow.json');
const abiFileContent = fs.readFileSync(abiPath, 'utf-8');
const YapBayEscrowABI = JSON.parse(abiFileContent);

// Load environment variables from .env file
dotenv.config();

const RPC_URL = process.env.VITE_CELO_RPC_URL;
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS;
const USDC_ADDRESS = process.env.VITE_USDC_ADDRESS_ALFAJORES;

if (!RPC_URL || !CONTRACT_ADDRESS || !USDC_ADDRESS) {
  console.error(
    'Error: Missing VITE_CELO_RPC_URL, VITE_CONTRACT_ADDRESS, or VITE_USDC_ADDRESS_ALFAJORES in .env file'
  );
  process.exit(1);
}

// Define the EscrowState as a const object to match the contract
const EscrowState = {
  CREATED: 0,
  FUNDED: 1,
  RELEASED: 2,
  CANCELLED: 3,
  DISPUTED: 4,
  RESOLVED: 5,
} as const; // Use 'as const' for stricter typing if desired
type EscrowState = (typeof EscrowState)[keyof typeof EscrowState]; // Type alias for state numbers

// Helper to format address
const formatAddress = (address: string, short = false) => {
  if (!address || address === ethers.ZeroAddress) return 'None';
  if (short) {
    // Return only last 4 chars
    return address.substring(address.length - 4);
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Interface for the output table data (final columns)
interface EscrowOutputData {
  'Escrow ID': string;
  'Trade ID': string;
  State: string;
  Amount: string;
  Balance: string;
  Seller: string; // Last 4 chars
  Buyer: string; // Last 4 chars
  Seq: 't' | 'f'; // Abbreviated & Changed type
  'Fiat Paid': 't' | 'f';
}

// Copy of the getUsdcBalance function from chainService.ts
/**
 * Fetches the USDC balance for a given wallet address using VITE_CELO_RPC_URL.
 * @param address Wallet address (string)
 * @returns Promise<BigInt> USDC balance (in smallest unit, e.g. 6 decimals)
 */
async function getUsdcBalance(address: string): Promise<bigint> {
  // Use ethers.js for direct RPC call
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const usdcAddress = USDC_ADDRESS;
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
  const contract = new ethers.Contract(usdcAddress!, erc20BalanceOfAbi, provider);
  const balance: bigint = await contract.balanceOf(address);
  return balance;
}

async function main() {
  console.log(`Connecting to Celo Alfajores RPC: ${RPC_URL}`);
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log(`Using contract address: ${CONTRACT_ADDRESS}`);
  const contract = new ethers.Contract(CONTRACT_ADDRESS!, YapBayEscrowABI.abi, provider);

  console.log('Querying EscrowCreated events...');

  const escrowIds: Set<string> = new Set();
  const outputData: EscrowOutputData[] = [];

  try {
    const eventFilter = contract.filters.EscrowCreated();
    const logs = await contract.queryFilter(eventFilter, 0, 'latest'); // Adjust block range if needed

    console.log(`Found ${logs.length} EscrowCreated events.`);

    logs.forEach(log => {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog && parsedLog.name === 'EscrowCreated') {
        const escrowId = parsedLog.args.escrowId.toString();
        escrowIds.add(escrowId);
      }
    });

    console.log(`Extracted ${escrowIds.size} unique escrow IDs.`);

    if (escrowIds.size === 0) {
      console.log('No escrow IDs found from events.');
      return;
    }

    console.log('\nFetching details for each escrow ID...');

    // Use Promise.all for potentially faster fetching
    const fetchPromises = Array.from(escrowIds).map(async id => {
      try {
        const escrowData = await contract.escrows(id);

        if (!escrowData) {
          console.error(`   !!! Received null/undefined data for Escrow ID ${id}`);
          return;
        }

        // Extract relevant fields based on ABI structure (indices might change if ABI does!)
        const trade_id: bigint = escrowData[1];
        const seller: string = escrowData[2];
        const buyer: string = escrowData[3];
        const amountBigInt: bigint = escrowData[5];
        const state = Number(escrowData[8]) as EscrowState;
        const sequential: boolean = escrowData[9];
        const sequentialEscrowAddress: string = escrowData[10];
        const fiat_paid: boolean = escrowData[11];

        // Calculate the balance based on escrow state
        let balance = BigInt(0);
        
        // Get the state name first before using it in logs
        const stateName =
          Object.keys(EscrowState).find(
            key => EscrowState[key as keyof typeof EscrowState] === state
          ) ?? `UNKNOWN (${state})`;
        
        try {
          // If this is a sequential escrow, check the sequential escrow address
          if (sequential && sequentialEscrowAddress !== ethers.ZeroAddress) {
            // For sequential escrows, get the actual balance of the sequential escrow address
            balance = await getUsdcBalance(sequentialEscrowAddress);
          } else {
            // For non-sequential escrows, calculate the balance based on state
            if (state === EscrowState.FUNDED) {
              // If the escrow is FUNDED, it should have the full amount
              balance = amountBigInt;
            } else if (state === EscrowState.RELEASED || state === EscrowState.CANCELLED) {
              // If the escrow is RELEASED or CANCELLED, it should have zero balance
              balance = BigInt(0);
            } else {
              // For other states, also zero balance
              balance = BigInt(0);
            }
          }
        } catch (balanceError) {
          console.error(`   !!! Error calculating balance for Escrow ID ${id}:`, balanceError);
          console.log(`   [WARNING] Unable to determine balance for escrow ${id}`);
        }

        // Populate the final data object with formatting
        outputData.push({
          'Escrow ID': id,
          'Trade ID': trade_id.toString(),
          State: stateName,
          Amount: ethers.formatUnits(amountBigInt, 6),
          Balance: ethers.formatUnits(balance, 6),
          Seller: formatAddress(seller, true),
          Buyer: formatAddress(buyer, true),
          Seq: sequential ? 't' : 'f', // Use abbreviated name
          'Fiat Paid': fiat_paid ? 't' : 'f',
        });
      } catch (fetchError) {
        // This catch should handle errors during fetching/processing for a single ID
        console.error(`   !!! Error processing Escrow ID ${id}:`, fetchError);
      }
    });

    console.log('Waiting for all escrow details to be fetched...');
    await Promise.all(fetchPromises);
    console.log('...All escrow details fetched (or failed).');

    // Sort data by Escrow ID for consistent output
    outputData.sort((a, b) => parseInt(a['Escrow ID']) - parseInt(b['Escrow ID']));

    console.log('\nEscrow Details:');
    console.table(outputData);

    // Calculate and display the total amount of USDC held in escrow
    const totalUsdcInEscrow = outputData.reduce((total, escrow) => {
      // Add to total only if there's a balance (converts string to number)
      return total + parseFloat(escrow.Balance);
    }, 0);

    console.log(`\nTotal USDC currently held in escrow: ${totalUsdcInEscrow.toFixed(2)} USDC`);

    // Get the real contract balance for comparison
    try {
      const contractBalance = await getUsdcBalance(CONTRACT_ADDRESS!);
      const contractBalanceFormatted = ethers.formatUnits(contractBalance, 6);
      console.log(`Total USDC balance of escrow contract: ${contractBalanceFormatted} USDC`);

      if (Math.abs(totalUsdcInEscrow - parseFloat(contractBalanceFormatted)) > 0.01) {
        console.log(`Note: There is a difference between calculated escrow total (${totalUsdcInEscrow.toFixed(2)}) and actual contract balance (${contractBalanceFormatted}).`);
        console.log(`This could be due to:
  - Escrows in transition states
  - Sequential escrows with separate addresses
  - Other funds in the contract not associated with active escrows`);
      }
    } catch (error) {
      console.error('Error fetching total contract balance:', error);
    }
  } catch (error) {
    // This catch handles errors during event querying or if Promise.all rejects unexpectedly
    console.error('\n!!! Top-level error:', error);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
