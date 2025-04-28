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

if (!RPC_URL || !CONTRACT_ADDRESS) {
  console.error('Error: Missing VITE_CELO_RPC_URL or VITE_CONTRACT_ADDRESS in .env file');
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
        console.log(`   Fetching details for Escrow ID ${id}...`);
        const escrowData = await contract.escrows(id);
        console.log(`   ...Fetched details for Escrow ID ${id}`);

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
        const fiat_paid: boolean = escrowData[11];
        // const counter: bigint = escrowData[12]; // Removed

        console.log(`   ...Extracted data for Escrow ID ${id}`);

        let balance = '0.00';
        if (state >= EscrowState.FUNDED && state !== EscrowState.CANCELLED) {
          balance = ethers.formatUnits(amountBigInt, 6); // Format USDC (6 decimals)
        }

        const stateName =
          Object.keys(EscrowState).find(
            key => EscrowState[key as keyof typeof EscrowState] === state
          ) ?? `UNKNOWN (${state})`;

        console.log(`   ...Calculated balance/state for Escrow ID ${id}`);

        // Populate the final data object with formatting
        outputData.push({
          'Escrow ID': id,
          'Trade ID': trade_id.toString(),
          State: stateName,
          Amount: ethers.formatUnits(amountBigInt, 6),
          Balance: balance,
          Seller: formatAddress(seller, true),
          Buyer: formatAddress(buyer, true),
          Seq: sequential ? 't' : 'f', // Use abbreviated name
          'Fiat Paid': fiat_paid ? 't' : 'f',
        });
        console.log(`   ...Pushed data for Escrow ID ${id}`);
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
  } catch (error) {
    // This catch handles errors during event querying or if Promise.all rejects unexpectedly
    console.error('\n!!! Top-level error:', error);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
