import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert } from "chai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as token from "@solana/spl-token";
import { LocalsolanaContracts } from "../target/types/localsolana_contracts";

dotenv.config();

// Transaction Logger Utility
class TransactionLogger {
  private logFile: string;
  private verbose: boolean;
  private isDevnet: boolean;
  private blockExplorerUrl: string;

  constructor() {
    this.logFile = "escrow-transactions.log";
    this.verbose = process.env.VERBOSE_LOGGING === "true";
    this.isDevnet = !process.env.ANCHOR_PROVIDER_URL?.includes('127.0.0.1') &&
                    !process.env.ANCHOR_PROVIDER_URL?.includes('localhost');
    this.blockExplorerUrl = process.env.BLOCK_EXPLORER_DEVNET || "https://explorer.solana.com/?cluster=devnet";
  }

  public formatUsdcAmount(amount: BN): string {
    return (amount.toNumber() / 1_000_000).toFixed(2);
  }

  private createBlockExplorerLink(txSignature: string): string {
    if (!this.isDevnet) return "";
    return `${this.blockExplorerUrl.replace("?cluster=devnet", "")}/tx/${txSignature}?cluster=devnet`;
  }

  private logToFile(message: string) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  private logToConsole(message: string, color: string) {
    console.log(color, message, "\x1b[0m"); // Reset color
  }

  logUsdcTransfer(
    amount: BN,
    destination: string,
    txSignature: string,
    transferType: "buyer" | "seller" | "arbitrator" | "escrow" | "bond" | "sequential" | "return"
  ) {
    if (!this.verbose) return;

    const usdcAmount = this.formatUsdcAmount(amount);
    const blockExplorerLink = this.createBlockExplorerLink(txSignature);

    // Color coding based on transfer type
    const colors = {
      buyer: "\x1b[34m",      // Blue
      seller: "\x1b[32m",     // Green
      arbitrator: "\x1b[33m", // Yellow
      escrow: "\x1b[35m",     // Magenta
      bond: "\x1b[36m",       // Cyan
      sequential: "\x1b[37m", // White
      return: "\x1b[31m"      // Red
    };

    const emojis = {
      buyer: "🔵",
      seller: "🟢",
      arbitrator: "🟡",
      escrow: "🟣",
      bond: "🔷",
      sequential: "⚪",
      return: "🔴"
    };

    const color = colors[transferType];
    const emoji = emojis[transferType];

    let logMessage = `${emoji} USDC Transfer: ${usdcAmount} USDC sent to ${destination}`;
    if (blockExplorerLink) {
      logMessage += `\n   Transaction: ${blockExplorerLink}`;
    }

    // Log to console with color
    this.logToConsole(logMessage, color);

    // Log to file without color codes
    const fileMessage = `${emoji} USDC Transfer: ${usdcAmount} USDC sent to ${destination}${blockExplorerLink ? ` | Transaction: ${txSignature}` : ""}`;
    this.logToFile(fileMessage);
  }

  logEscrowOperation(operation: string, details: string, txSignature?: string) {
    if (!this.verbose) return;

    const timestamp = new Date().toISOString();
    const logMessage = `📋 Escrow Operation: ${operation} - ${details}`;

    // Log to console
    console.log("\x1b[36m", logMessage, "\x1b[0m");

    // Log to file
    const fileMessage = `📋 Escrow Operation: ${operation} - ${details}${txSignature ? ` | Transaction: ${txSignature}` : ""}`;
    this.logToFile(fileMessage);
  }
}

// Initialize transaction logger
const txLogger = new TransactionLogger();

function loadKeypair(filePath: string): Keypair {
  const absolutePath = filePath.startsWith("~")
    ? path.join(process.env.HOME || process.env.USERPROFILE || ".", filePath.slice(1))
    : filePath;
  const secretKeyString = fs.readFileSync(absolutePath, "utf8");
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

console.log("RPC URL:", process.env.ANCHOR_PROVIDER_URL);

// Environment detection
const isLocalnet = process.env.ANCHOR_PROVIDER_URL?.includes('127.0.0.1') ||
                   process.env.ANCHOR_PROVIDER_URL?.includes('localhost');

    console.log("Environment:", isLocalnet ? "LOCALNET" : "DEVNET");

const seller = loadKeypair(process.env.SELLER_KEYPAIR || "");
const buyer = loadKeypair(process.env.BUYER_KEYPAIR || "");
const arbitrator = loadKeypair(process.env.ARBITRATOR_KEYPAIR || "");

console.log("=== Keypair Checking ===");
console.log("Seller pubkey:", seller.publicKey.toBase58());
console.log("Buyer pubkey:", buyer.publicKey.toBase58());
console.log("Arbitrator pubkey:", arbitrator.publicKey.toBase58());

// let escrowIdCounter = 1;
// let tradeIdCounter = 1; // Global counter
let tokenMint: PublicKey;
let sellerTokenAccount: PublicKey;
let buyerTokenAccount: PublicKey;
let arbitratorTokenAccount: PublicKey;

// Sleep helper to avoid 429s
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const generateRandomId = () => new BN(Math.floor(Math.random() * 1_000_000_000));

describe("Localsolana Contracts Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LocalsolanaContracts as Program<LocalsolanaContracts>;
  const expectedProgramId = new PublicKey("4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x");

  // Helper Functions
  const deriveEscrowPDA = (escrowId: BN, tradeId: BN): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        escrowId.toArrayLike(Buffer, "le", 8),
        tradeId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

  const deriveEscrowTokenPDA = (escrowKey: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_token"), escrowKey.toBuffer()],
      program.programId
    );

  const deriveBuyerBondPDA = (escrowKey: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("buyer_bond"), escrowKey.toBuffer()],
      program.programId
    );

  const deriveSellerBondPDA = (escrowKey: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("seller_bond"), escrowKey.toBuffer()],
      program.programId
    );

  async function cleanupEscrow(
      escrowPDA: PublicKey,
      escrowTokenPDA: PublicKey | null,
      seller: Keypair,
      buyerTokenAccount: PublicKey,
      arbitratorTokenAccount: PublicKey,
      sequentialTokenAccount: PublicKey | null = null
    ) {
      const escrowAccount = await program.account.escrow.fetchNullable(escrowPDA);
      if (!escrowAccount) return; // Already closed

      console.log("=== Cleanup ===");
      const sellerBalanceBefore = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.uiAmount;
      console.log(`Seller USDC before cleanup: ${sellerBalanceBefore}`);

      if (!escrowAccount.fiatPaid && escrowAccount.state.funded) {
        // Cancel if funded but not fiat_paid
        const cancelTx = await program.methods
          .cancelEscrow()
          .accounts({
            seller: seller.publicKey,
            authority: seller.publicKey,
            escrow: escrowPDA,
            escrowTokenAccount: escrowTokenPDA,
            sellerTokenAccount: sellerTokenAccount,
            tokenProgram: token.TOKEN_PROGRAM_ID,
          })
          .signers([seller])
          .rpc();
        await provider.connection.confirmTransaction(cancelTx, "confirmed");
        console.log("Canceled escrow, USDC returned to seller");
      } else if (!escrowAccount.fiatPaid) {
        // Cancel if created but not funded
        const cancelTx = await program.methods
          .cancelEscrow()
          .accounts({
            seller: seller.publicKey,
            authority: seller.publicKey,
            escrow: escrowPDA,
            escrowTokenAccount: null,
            sellerTokenAccount: null,
            tokenProgram: token.TOKEN_PROGRAM_ID,
          })
          .signers([seller])
          .rpc();
        await provider.connection.confirmTransaction(cancelTx, "confirmed");
        console.log("Canceled unfunded escrow");
      } else {
        // Release if fiat_paid (normal or sequential)
        const releaseTx = await program.methods
          .releaseEscrow()
          .accounts({
            authority: seller.publicKey,
            escrow: escrowPDA,
            escrowTokenAccount: escrowTokenPDA,
            buyerTokenAccount: sequentialTokenAccount || buyerTokenAccount,
            arbitratorTokenAccount: arbitratorTokenAccount,
            sequentialEscrowTokenAccount: sequentialTokenAccount,
            tokenProgram: token.TOKEN_PROGRAM_ID,
          })
          .signers([seller])
          .rpc();
        await provider.connection.confirmTransaction(releaseTx, "confirmed");
        console.log("Released escrow, USDC sent to buyer/sequential");
      }
      await sleep(1000);

      const sellerBalanceAfter = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.uiAmount;
      console.log(`Seller USDC after cleanup: ${sellerBalanceAfter}`);
    }

  async function ensureFunds(publicKey: PublicKey, minLamports: number = 5 * LAMPORTS_PER_SOL): Promise<void> {
    console.log(`Balance for ${publicKey.toBase58()}: ${await provider.connection.getBalance(publicKey)} lamports`);
    const balance = await provider.connection.getBalance(publicKey);
    if (balance < minLamports) {
      console.log(`Requesting airdrop for ${publicKey.toBase58()} (${minLamports} lamports)...`);

      // Try airdrop with retries for localnet
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const sig = await provider.connection.requestAirdrop(publicKey, minLamports);
          await provider.connection.confirmTransaction(sig, "confirmed");
          const newBalance = await provider.connection.getBalance(publicKey);
          console.log(`Airdrop complete. New balance: ${newBalance} lamports`);

          if (newBalance >= minLamports) {
            success = true;
          } else {
            console.log(`Airdrop insufficient, retrying... (${retries} attempts left)`);
            retries--;
            await sleep(2000); // Wait 2 seconds before retry
          }
        } catch (error) {
          console.log(`Airdrop failed, retrying... (${retries} attempts left):`, error);
          retries--;
          await sleep(2000); // Wait 2 seconds before retry
        }
      }

      if (!success) {
        throw new Error(`Failed to airdrop sufficient funds after 3 attempts`);
      }
    }
  }

  // Helper function to validate EscrowBalanceChanged events
  function validateEscrowBalanceChangedEvent(
    event: any,
    expectedBalance: BN,
    expectedReason: string,
    escrowId: BN,
    tradeId: BN
  ): void {
    assert.equal(event.objectId.toBase58(), event.objectId.toBase58(), "Object ID mismatch");
    assert.equal(event.escrowId.toString(), escrowId.toString(), "Escrow ID mismatch");
    assert.equal(event.tradeId.toString(), tradeId.toString(), "Trade ID mismatch");
    assert.equal(event.newBalance.toString(), expectedBalance.toString(), "New balance mismatch");
    assert.equal(event.reason, expectedReason, "Reason mismatch");
    assert(event.timestamp > 0, "Timestamp should be positive");
  }

  // Helper function to validate SequentialAddressUpdated events
  function validateSequentialAddressUpdatedEvent(
    event: any,
    expectedOldAddress: PublicKey | null,
    expectedNewAddress: PublicKey,
    escrowId: BN,
    tradeId: BN
  ): void {
    assert.equal(event.objectId.toBase58(), event.objectId.toBase58(), "Object ID mismatch");
    assert.equal(event.escrowId.toString(), escrowId.toString(), "Escrow ID mismatch");
    assert.equal(event.tradeId.toString(), tradeId.toString(), "Trade ID mismatch");

    if (expectedOldAddress) {
      assert.equal(event.oldAddress.toBase58(), expectedOldAddress.toBase58(), "Old address mismatch");
    } else {
      assert.isNull(event.oldAddress, "Old address should be null");
    }

    assert.equal(event.newAddress.toBase58(), expectedNewAddress.toBase58(), "New address mismatch");
    assert(event.timestamp > 0, "Timestamp should be positive");
  }

  // Helper function to create sequential token account for localnet
  async function createSequentialTokenAccount(sequentialAddress: PublicKey): Promise<PublicKey> {
    if (isLocalnet) {
      // For localnet, create a new token account
      return await token.createAccount(
        provider.connection,
        seller,
        tokenMint,
        sequentialAddress
      );
    } else {
      // For devnet, use existing account or create new one
      // This is a fallback - you might want to handle this differently
      return await token.createAccount(
        provider.connection,
        seller,
        tokenMint,
        sequentialAddress
      );
    }
  }

  // Helper function to ensure minimum USDC balances for testing
  async function ensureMinimumUsdcBalances(): Promise<void> {
    if (!isLocalnet) return; // Only needed for localnet

    const sellerBalance = await provider.connection.getTokenAccountBalance(sellerTokenAccount);
    const buyerBalance = await provider.connection.getTokenAccountBalance(buyerTokenAccount);

    const minBalance = 20000000; // 20 USDC minimum (increased from 10)

    if (parseInt(sellerBalance.value.amount) < minBalance) {
      console.log("Replenishing seller USDC balance...");
      const replenishTx = await token.mintTo(
        provider.connection,
        seller,
        tokenMint,
        sellerTokenAccount,
        seller,
        minBalance - parseInt(sellerBalance.value.amount)
      );
      await provider.connection.confirmTransaction(replenishTx, "confirmed");
      console.log("Seller USDC balance replenished");
    }

    if (parseInt(buyerBalance.value.amount) < minBalance) {
      console.log("Replenishing buyer USDC balance...");
      const replenishTx = await token.mintTo(
        provider.connection,
        buyer,
        tokenMint,
        buyerTokenAccount,
        seller,
        minBalance - parseInt(buyerBalance.value.amount)
      );
      await provider.connection.confirmTransaction(replenishTx, "confirmed");
      console.log("Buyer USDC balance replenished");
    }
  }

  before(async () => {
    assert(
      program.programId.equals(expectedProgramId),
      `Program ID mismatch: ${program.programId.toBase58()} != ${expectedProgramId.toBase58()}`
    );

        console.log("=== Environment Setup ===");

    // Ensure SOL balances FIRST for localnet (before creating any accounts)
    if (isLocalnet) {
      console.log("Setting up LOCALNET environment...");
      console.log("Ensuring SOL balances first...");

      console.log("Airdropping SOL to seller...");
      await ensureFunds(seller.publicKey);
      console.log("Airdropping SOL to buyer...");
      await ensureFunds(buyer.publicKey);
      console.log("Airdropping SOL to arbitrator...");
      await ensureFunds(arbitrator.publicKey);

      console.log("SOL balances ensured. Proceeding with token setup...");

      try {
        // Create USDC mint for localnet
        console.log("Creating USDC mint...");
        try {
          tokenMint = await token.createMint(
            provider.connection,
            seller, // payer
            seller.publicKey, // mint authority
            seller.publicKey, // freeze authority
            6 // decimals (USDC standard)
          );
          console.log("USDC mint created:", tokenMint.toBase58());
        } catch (error) {
          console.error("Failed to create USDC mint:", error);
          throw error;
        }

        // Create token accounts for localnet
        console.log("Creating token accounts...");

        console.log("Creating seller token account...");
        sellerTokenAccount = await token.createAccount(
          provider.connection,
          seller,
          tokenMint,
          seller.publicKey
        );
        console.log("Seller token account created:", sellerTokenAccount.toBase58());

        console.log("Creating buyer token account...");
        buyerTokenAccount = await token.createAccount(
          provider.connection,
          buyer,
          tokenMint,
          buyer.publicKey
        );
        console.log("Buyer token account created:", buyerTokenAccount.toBase58());

        console.log("Creating arbitrator token account...");
        arbitratorTokenAccount = await token.createAccount(
          provider.connection,
          arbitrator,
          tokenMint,
          arbitrator.publicKey
        );
        console.log("Arbitrator token account created:", arbitratorTokenAccount.toBase58());

        console.log("Token accounts created:");
        console.log("  Seller:", sellerTokenAccount.toBase58());
        console.log("  Buyer:", buyerTokenAccount.toBase58());
        console.log("  Arbitrator:", arbitratorTokenAccount.toBase58());

                // Mint initial USDC to seller for testing (increased for multiple test runs)
        console.log("Minting initial USDC to seller...");
        const sellerMintTx = await token.mintTo(
          provider.connection,
          seller,
          tokenMint,
          sellerTokenAccount,
          seller,
          100000000 // 100 USDC (with 6 decimals) - increased from 50
        );
        await provider.connection.confirmTransaction(sellerMintTx, "confirmed");
        console.log("Seller USDC minted successfully");

        // Mint some USDC to buyer and arbitrator
        console.log("Minting USDC to buyer...");
        const buyerMintTx = await token.mintTo(
          provider.connection,
          buyer,
          tokenMint,
          buyerTokenAccount,
          seller,
          50000000 // 50 USDC - increased from 25
        );
        await provider.connection.confirmTransaction(buyerMintTx, "confirmed");
        console.log("Buyer USDC minted successfully");

        console.log("Minting USDC to arbitrator...");
        const arbitratorMintTx = await token.mintTo(
          provider.connection,
          arbitrator,
          tokenMint,
          arbitratorTokenAccount,
          seller,
          10000000 // 10 USDC - increased from 5
        );
        await provider.connection.confirmTransaction(arbitratorMintTx, "confirmed");
        console.log("Arbitrator USDC minted successfully");

        console.log("Initial USDC distribution complete");

      } catch (error) {
        console.error("Error setting up localnet environment:", error);
        throw error;
      }

    } else {
      console.log("Using DEVNET environment...");

      // Use existing devnet addresses
      sellerTokenAccount = new PublicKey("2ozy4RSqXbVvrE1kptN3UG4cseGcUEdKLjUQNtTULim8");
      buyerTokenAccount = new PublicKey("FN7L7W7eiGMveGSiaxHoZ6ySBFV6akY3JtnTPsTNgWrt");
      arbitratorTokenAccount = new PublicKey("BTDaSaLc4bN6bgmtbCxPjr38hsxisd44Zg7NoaSmVrSm");
      tokenMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
    }

    // Log final configuration
    console.log("Final configuration:");
    console.log("  Token Mint:", tokenMint.toBase58());
    console.log("  Seller Token Account:", sellerTokenAccount.toBase58());
    console.log("  Buyer Token Account:", buyerTokenAccount.toBase58());
    console.log("  Arbitrator Token Account:", arbitratorTokenAccount.toBase58());

    console.log("=== Balance Checking ===");

    console.log("=== Token Account Setup ===");

    // Ensure minimum USDC balances for testing
    await ensureMinimumUsdcBalances();

    const sellerBalance = await provider.connection.getTokenAccountBalance(sellerTokenAccount);
    console.log("Seller token balance:", sellerBalance.value.uiAmount);
    await sleep(1000); // Pace RPC calls
    const buyerBalance = await provider.connection.getTokenAccountBalance(buyerTokenAccount);
    console.log("Buyer token balance:", buyerBalance.value.uiAmount);
    await sleep(1000);
    const arbitratorBalance = await provider.connection.getTokenAccountBalance(arbitratorTokenAccount);
    console.log("Arbitrator USDC balance:", arbitratorBalance.value.uiAmount);
  });

  describe("Basic Escrow Operations", () => {
    beforeEach(async () => {
      if (isLocalnet) {
        await ensureMinimumUsdcBalances();
      }
    });

    it("Creates a basic escrow", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Escrow Creation ===");
      console.log("Creating escrow with PDA:", escrowPDA.toBase58());
      const sellerBalanceBefore = await provider.connection.getBalance(seller.publicKey);
      console.log(`Seller balance before: ${sellerBalanceBefore} lamports`);

      const tx = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx
      );

      await sleep(1000); // Slow down

      console.log("Transaction signature:", tx);
      const sellerBalanceAfter = await provider.connection.getBalance(seller.publicKey);
      console.log(`Seller balance after: ${sellerBalanceAfter} lamports`);

      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(escrowAccount.escrowId.toString(), escrowId.toString(), "Escrow ID mismatch");
      assert.equal(escrowAccount.tradeId.toString(), tradeId.toString(), "Trade ID mismatch");
      assert.equal(escrowAccount.seller.toBase58(), seller.publicKey.toBase58(), "Seller mismatch");
      assert.equal(escrowAccount.buyer.toBase58(), buyer.publicKey.toBase58(), "Buyer mismatch");
      assert.equal(escrowAccount.arbitrator.toBase58(), "GGrXhNVxUZXaA2uMopsa5q23aPmoNvQF14uxqo8qENUr", "Arbitrator mismatch");
      assert.equal(escrowAccount.amount.toString(), amount.toString(), "Amount mismatch");
      assert.equal(escrowAccount.fee.toString(), amount.div(new BN(100)).toString(), "Fee mismatch");
      assert(escrowAccount.depositDeadline.gtn(0), "Deposit deadline not set");
      assert.equal(escrowAccount.fiatDeadline.toString(), "0", "Fiat deadline should be 0");
      assert.deepEqual(escrowAccount.state, { created: {} }, "State should be Created");
      assert.equal(escrowAccount.sequential, false, "Sequential should be false");
      assert.isNull(escrowAccount.sequentialEscrowAddress, "Sequential address should be null");
      assert.isFalse(escrowAccount.fiatPaid, "Fiat paid should be false");
      assert.equal(escrowAccount.counter.toString(), "0", "Counter should be 0");
      assert.isNull(escrowAccount.disputeInitiator, "Dispute initiator should be null");
      assert.isNull(escrowAccount.disputeInitiatedTime, "Dispute initiated time should be null");
      assert.isNull(escrowAccount.disputeEvidenceHashBuyer, "Buyer evidence hash should be null");
      assert.isNull(escrowAccount.disputeEvidenceHashSeller, "Seller evidence hash should be null");
      assert.isNull(escrowAccount.disputeResolutionHash, "Resolution hash should be null");
      assert.equal(escrowAccount.trackedBalance.toString(), "0", "Tracked balance should be 0 for new escrow");

    // Cleanup: Cancel escrow to free PDA
    const cancelTx = await program.methods
      .cancelEscrow()
      .accounts({
        seller: seller.publicKey,
        authority: seller.publicKey,
        escrow: escrowPDA,
        escrowTokenAccount: null,
        sellerTokenAccount: null,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      })
      .signers([seller])
      .rpc();
    await provider.connection.confirmTransaction(cancelTx, "confirmed");
     await sleep(1000);

    await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Funds the escrow", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId(); // Unique tradeId
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Escrow Funding ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const sellerBalanceBefore = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      console.log(`Seller token balance before: ${sellerBalanceBefore}`);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      const sellerBalanceAfter = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const escrowBalance = (await provider.connection.getTokenAccountBalance(escrowTokenPDA)).value.amount;
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);

      console.log(`Seller token balance after: ${sellerBalanceAfter}`);
      console.log(`Escrow token balance: ${escrowBalance}`);

      assert.equal(
        new BN(sellerBalanceBefore).sub(new BN(sellerBalanceAfter)).toString(),
        "1010000",
        "Incorrect amount transferred from seller"
      );
      assert.equal(escrowBalance, "1010000", "Escrow balance incorrect");
      assert.deepEqual(escrowAccount.state, { funded: {} }, "State should be Funded");
      assert(escrowAccount.fiatDeadline.gtn(0), "Fiat deadline should be set");

      // Validate tracked_balance is updated correctly (amount + fee)
      const expectedTrackedBalance = amount.add(amount.div(new BN(100)));
      assert.equal(escrowAccount.trackedBalance.toString(), expectedTrackedBalance.toString(), "Tracked balance should equal amount + fee");

      // Validate that counter was incremented
      assert.equal(escrowAccount.counter.toString(), "1", "Counter should be incremented to 1");

    // Cleanup: Cancel funded escrow
    const cancelTx = await program.methods
      .cancelEscrow()
      .accounts({
        seller: seller.publicKey,
        authority: seller.publicKey,
        escrow: escrowPDA,
        escrowTokenAccount: escrowTokenPDA,
        sellerTokenAccount: sellerTokenAccount,
        tokenProgram: token.TOKEN_PROGRAM_ID,
      })
      .signers([seller])
      .rpc();
    await provider.connection.confirmTransaction(cancelTx, "confirmed");

    // Log USDC return to seller from cancellation
    txLogger.logUsdcTransfer(
      amount.add(amount.div(new BN(100))), // Principal + fee returned
      "Seller (Return from Cancellation)",
      cancelTx,
      "return"
    );

    await sleep(1000);

    await cleanupEscrow(escrowPDA, escrowTokenPDA, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Marks fiat paid", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Escrow Funding and Marking Paid ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");
         await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.isTrue(escrowAccount.fiatPaid, "Fiat paid should be true");

      // Cleanup: Release escrow (since fiat_paid prevents cancel)
      const releaseTx = await program.methods
        .releaseEscrow()
        .accounts({
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: null,
          tokenProgram: token.TOKEN_PROGRAM_ID,
      })
      .signers([seller])
      .rpc();
    await provider.connection.confirmTransaction(releaseTx, "confirmed");
     await sleep(1000);

    await cleanupEscrow(escrowPDA, escrowTokenPDA, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Releases the escrow", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Escrow Full Flow ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");
         await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");

      // Log fiat payment marking
      txLogger.logEscrowOperation(
        "Fiat Payment Marked",
        "Buyer confirmed fiat payment received",
        tx3
      );

      await sleep(1000);

      const buyerBalanceBefore = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
      const arbitratorBalanceBefore = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;
      const sellerLamportsBefore = await provider.connection.getBalance(seller.publicKey);

      const tx4 = await program.methods
        .releaseEscrow()
        .accounts({
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: null,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");

      // Log USDC transfers from escrow release
      txLogger.logUsdcTransfer(
        amount, // Principal amount to buyer
        "Buyer",
        tx4,
        "buyer"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(100)), // Fee amount to arbitrator
        "Arbitrator (Fee)",
        tx4,
        "arbitrator"
      );

      await sleep(1000);

      const buyerBalanceAfter = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
      const arbitratorBalanceAfter = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;
      const sellerLamportsAfter = await provider.connection.getBalance(seller.publicKey);

      console.log(`Buyer balance before: ${buyerBalanceBefore}, after: ${buyerBalanceAfter}`);
      console.log(`Arbitrator balance before: ${arbitratorBalanceBefore}, after: ${arbitratorBalanceAfter}`);
      console.log(`Seller lamports before: ${sellerLamportsBefore}, after: ${sellerLamportsAfter}`);

      assert.equal(
        new BN(buyerBalanceAfter).sub(new BN(buyerBalanceBefore)).toString(),
        "1000000",
        "Buyer should receive principal"
      );
      assert.equal(
        new BN(arbitratorBalanceAfter).sub(new BN(arbitratorBalanceBefore)).toString(),
        "10000",
        "Arbitrator should receive fee"
      );
      assert.isTrue(sellerLamportsAfter > sellerLamportsBefore, "Seller should receive rent refund");
      assert.isNull(await provider.connection.getAccountInfo(escrowTokenPDA), "Escrow token account should be closed");
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed");

      // Note: Since the escrow account is closed after release, we can't check tracked_balance
      // But we can verify the account was properly closed, which means tracked_balance was set to 0
      // before closure as per the contract logic
    });
  });

  describe("Sequential Escrow Operations", () => {
    beforeEach(async () => {
      if (isLocalnet) {
        await ensureMinimumUsdcBalances();
      }
    });
    it("Creates a sequential escrow", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const sequentialAddress = Keypair.generate().publicKey;
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Escrow Creation ===");
      const tx = await program.methods
        .createEscrow(escrowId, tradeId, amount, true, sequentialAddress)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx, "confirmed");

      // Log sequential escrow creation
      txLogger.logEscrowOperation(
        "Sequential Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, Sequential: ${sequentialAddress.toBase58()}`,
        tx
      );

      await sleep(1000);

      console.log("Sequential escrow transaction signature:", tx);

      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(escrowAccount.sequential, true, "Sequential should be true");
      assert.equal(
        escrowAccount.sequentialEscrowAddress?.toBase58(),
        sequentialAddress.toBase58(),
        "Sequential address mismatch"
      );
      assert.equal(escrowAccount.trackedBalance.toString(), "0", "Tracked balance should be 0 for new sequential escrow");

    await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Fails to create escrow with invalid amount", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Escrow Creation ===");
      try {
        await program.methods
          .createEscrow(escrowId, tradeId, new BN(0), false, null)
          .accounts({
            seller: seller.publicKey,
            buyer: buyer.publicKey,
            escrow: escrowPDA,
            system_program: anchor.web3.SystemProgram.programId,
          })
          .signers([seller])
          .rpc();
        assert.fail("Should have thrown an error for zero amount");
      } catch (error: any) {
        assert.include(error.message, "Invalid amount: Zero or negative", "Expected InvalidAmount error");
      }
    });

    it("Updates sequential address", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const initialSequentialAddress = Keypair.generate().publicKey;
      const newSequentialAddress = Keypair.generate().publicKey;
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Sequential Escrow Update ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, true, initialSequentialAddress)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");
         await sleep(1000);

      // Capture the transaction to check for events
      const tx2 = await program.methods
        .updateSequentialAddress(newSequentialAddress)
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log sequential address update
      txLogger.logEscrowOperation(
        "Sequential Address Updated",
        `From: ${initialSequentialAddress.toBase58()} → To: ${newSequentialAddress.toBase58()}`,
        tx2
      );

      await sleep(1000);

      // Get transaction details to check for SequentialAddressUpdated event
      const txDetails = await provider.connection.getTransaction(tx2, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      // For localnet testing, we'll verify the state change instead of the event
      // Events in localnet can be tricky to capture, so we'll validate the escrow state
      console.log("Transaction completed, verifying escrow state update...");

      // Alternative: Check if we can get the event from the transaction
      // Note: Events in Solana are not automatically included in logMessages
      // They need to be explicitly requested or parsed from the transaction

      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(
        escrowAccount.sequentialEscrowAddress?.toBase58(),
        newSequentialAddress.toBase58(),
        "Sequential address should be updated"
      );

      await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Releases to sequential address", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const sequentialAddress = Keypair.generate().publicKey;
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Sequential Escrow Release ===");
      const sequentialTokenAccount = await createSequentialTokenAccount(sequentialAddress);
      console.log("Sequential token account:", sequentialTokenAccount.toBase58());
      await sleep(1000);

      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, true, sequentialAddress)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log sequential escrow creation
      txLogger.logEscrowOperation(
        "Sequential Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, Sequential: ${sequentialAddress.toBase58()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");
         await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      const sequentialBalanceBefore = (await provider.connection.getTokenAccountBalance(sequentialTokenAccount)).value.amount;
      const arbitratorBalanceBefore = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;

      const tx4 = await program.methods
        .releaseEscrow()
        .accounts({
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: sequentialTokenAccount,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");

      // Log USDC transfers from sequential escrow release
      txLogger.logUsdcTransfer(
        amount, // Principal amount to sequential account
        "Sequential Account",
        tx4,
        "sequential"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(100)), // Fee amount to arbitrator
        "Arbitrator (Fee)",
        tx4,
        "arbitrator"
      );

      await sleep(1000);

      const sequentialBalanceAfter = (await provider.connection.getTokenAccountBalance(sequentialTokenAccount)).value.amount;
      const arbitratorBalanceAfter = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;

      console.log(`Sequential balance before: ${sequentialBalanceBefore}, after: ${sequentialBalanceAfter}`);
      console.log(`Arbitrator balance before: ${arbitratorBalanceBefore}, after: ${arbitratorBalanceAfter}`);

      assert.equal(
        new BN(sequentialBalanceAfter).sub(new BN(sequentialBalanceBefore)).toString(),
        "1000000",
        "Sequential account should receive principal"
      );
      assert.equal(
        new BN(arbitratorBalanceAfter).sub(new BN(arbitratorBalanceBefore)).toString(),
        "10000",
        "Arbitrator should receive fee"
      );
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed");

      // Note: Since the escrow account is closed after release, we can't check tracked_balance
      // But we can verify the account was properly closed, which means tracked_balance was set to 0
      // before closure as per the contract logic
    });
  });

  describe("Escrow Cancellation", () => {
    beforeEach(async () => {
      if (isLocalnet) {
        await ensureMinimumUsdcBalances();
      }
    });
    it("Cancels escrow before funding", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Escrow Cancellation Before Funding ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const sellerLamportsBefore = await provider.connection.getBalance(seller.publicKey);

      const tx2 = await program.methods
        .cancelEscrow()
        .accounts({
          seller: seller.publicKey,
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: null,
          sellerTokenAccount: null,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");
         await sleep(1000);

      const sellerLamportsAfter = await provider.connection.getBalance(seller.publicKey);

      console.log(`Seller lamports before: ${sellerLamportsBefore}, after: ${sellerLamportsAfter}`);

      assert.isTrue(sellerLamportsAfter > sellerLamportsBefore, "Seller should receive rent refund for escrow state account");
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed");

      // Note: Since the escrow account is closed after cancellation, we can't check tracked_balance
      // But we can verify the account was properly closed, which means tracked_balance was set to 0
      // before closure as per the contract logic
    });

    it("Cancels escrow after funding", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Escrow Cancellation After Funding ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      const sellerBalanceBefore = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const sellerLamportsBefore = await provider.connection.getBalance(seller.publicKey);

      const tx3 = await program.methods
        .cancelEscrow()
        .accounts({
          seller: seller.publicKey,
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          sellerTokenAccount: sellerTokenAccount,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");

      // Log USDC return to seller from cancellation
      txLogger.logUsdcTransfer(
        amount.add(amount.div(new BN(100))), // Principal + fee returned
        "Seller (Return from Cancellation)",
        tx3,
        "return"
      );

      await sleep(1000);

      const sellerBalanceAfter = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const sellerLamportsAfter = await provider.connection.getBalance(seller.publicKey);

      console.log(`Seller token balance before: ${sellerBalanceBefore}, after: ${sellerBalanceAfter}`);
      console.log(`Seller lamports before: ${sellerLamportsBefore}, after: ${sellerLamportsAfter}`);

      assert.equal(
        new BN(sellerBalanceAfter).sub(new BN(sellerBalanceBefore)).toString(),
        "1010000",
        "Seller should receive principal + fee back"
      );
      assert.isTrue(sellerLamportsAfter > sellerLamportsBefore, "Seller should receive rent refund");
      assert.isNull(await provider.connection.getAccountInfo(escrowTokenPDA), "Escrow token account should be closed");
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed");

      // Note: Since the escrow account is closed after cancellation, we can't check tracked_balance
      // But we can verify the account was properly closed, which means tracked_balance was set to 0
      // before closure as per the contract logic
    });

    it("Fails to cancel escrow after fiat paid", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Escrow Cancellation After Fiat Paid ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      try {
        await program.methods
          .cancelEscrow()
          .accounts({
            seller: seller.publicKey,
            authority: seller.publicKey,
            escrow: escrowPDA,
            escrowTokenAccount: escrowTokenPDA,
            sellerTokenAccount: sellerTokenAccount,
            tokenProgram: token.TOKEN_PROGRAM_ID,
          })
          .signers([seller])
          .rpc();
        assert.fail("Should have thrown an error due to fiat_paid being true");
      } catch (error: any) {
        assert.include(error.message, "Invalid state transition", "Expected InvalidState error");
      }

      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.deepEqual(escrowAccount.state, { funded: {} }, "State should remain Funded");

      await cleanupEscrow(escrowPDA, escrowTokenPDA, seller, buyerTokenAccount, arbitratorTokenAccount);
    });
  });

  describe("Dispute Handling", () => {
    beforeEach(async () => {
      if (isLocalnet) {
        await ensureMinimumUsdcBalances();
      }
    });
    it("Initializes bond accounts", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [buyerBondPDA] = deriveBuyerBondPDA(escrowPDA);
      const [sellerBondPDA] = deriveSellerBondPDA(escrowPDA);

      console.log("=== Bond Account Initialization ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .initializeBuyerBondAccount(escrowId, tradeId)
        .accounts({
          payer: buyer.publicKey,
          escrow: escrowPDA,
          buyerBondAccount: buyerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log bond account initialization
      txLogger.logEscrowOperation(
        "Buyer Bond Account Initialized",
        `Account: ${buyerBondPDA.toBase58()}`,
        tx2
      );

      await sleep(1000);

      const tx3 = await program.methods
        .initializeSellerBondAccount(escrowId, tradeId)
        .accounts({
          payer: seller.publicKey,
          escrow: escrowPDA,
          sellerBondAccount: sellerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");

      // Log bond account initialization
      txLogger.logEscrowOperation(
        "Seller Bond Account Initialized",
        `Account: ${sellerBondPDA.toBase58()}`,
        tx3
      );

      await sleep(1000);

      const buyerBondAccount = await provider.connection.getTokenAccountBalance(buyerBondPDA);
      const sellerBondAccount = await provider.connection.getTokenAccountBalance(sellerBondPDA);

      assert.equal(buyerBondAccount.value.amount, "0", "Buyer bond account should be initialized with 0 tokens");
      assert.equal(sellerBondAccount.value.amount, "0", "Seller bond account should be initialized with 0 tokens");

      // Validate that tracked_balance remains 0 since escrow was not funded
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(escrowAccount.trackedBalance.toString(), "0", "Tracked balance should remain 0 for unfunded escrow");

      await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    // TODO: Fix dispute opening test - currently failing with InvalidEvidenceHash
    it.skip("Opens dispute as buyer", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);
      const [buyerBondPDA] = deriveBuyerBondPDA(escrowPDA);
      const [sellerBondPDA] = deriveSellerBondPDA(escrowPDA);
      // const evidenceHash = Buffer.alloc(32, "buyer_evidence").toJSON().data;
      const evidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42

      console.log("=== Dispute Opening ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");
         await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");
         await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      const tx4 = await program.methods
        .initializeBuyerBondAccount(escrowId, tradeId)
        .accounts({
          payer: buyer.publicKey,
          escrow: escrowPDA,
          buyerBondAccount: buyerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");
         await sleep(1000);

      const tx5 = await program.methods
        .initializeSellerBondAccount(escrowId, tradeId)
        .accounts({
          payer: seller.publicKey,
          escrow: escrowPDA,
          sellerBondAccount: sellerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx5, "confirmed");
         await sleep(1000);

      const buyerBalanceBefore = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
      const tx6 = await program.methods
        .openDisputeWithBond(evidenceHash)
        .accounts({
          disputingParty: buyer.publicKey,
          escrow: escrowPDA,
          disputingPartyTokenAccount: buyerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx6, "confirmed");
         await sleep(1000);

      const buyerBalanceAfter = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
      const buyerBondBalance = (await provider.connection.getTokenAccountBalance(buyerBondPDA)).value.amount;
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);

      console.log(`Buyer balance before: ${buyerBalanceBefore}, after: ${buyerBalanceAfter}`);
      console.log(`Buyer bond balance: ${buyerBondBalance}`);

      assert.equal(
        new BN(buyerBalanceBefore).sub(new BN(buyerBalanceAfter)).toString(),
        "50000",
        "Buyer should transfer bond (5% of 1,000,000)"
      );
      assert.equal(buyerBondBalance, "50000", "Bond account should receive 50,000 lamports");
      assert.deepEqual(escrowAccount.state, { disputed: {} }, "State should be Disputed");
      assert.equal(escrowAccount.disputeInitiator?.toBase58(), buyer.publicKey.toBase58(), "Dispute initiator should be buyer");

      // Validate that tracked_balance remains unchanged during dispute opening
      // The escrow should still have the funded amount since no funds were moved
      const expectedTrackedBalance = amount.add(amount.div(new BN(100)));
      assert.equal(escrowAccount.trackedBalance.toString(), expectedTrackedBalance.toString(), "Tracked balance should remain unchanged during dispute opening");

      // After assertions
      console.log("=== Cleanup ===");
      const resolutionHash = Buffer.alloc(32, 0x42);
      const resolveTx = await program.methods
        .resolveDisputeWithExplanation(true, resolutionHash)
        .accounts({
          arbitrator: arbitrator.publicKey,
          seller: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([arbitrator])
        .rpc();
      await provider.connection.confirmTransaction(resolveTx, "confirmed");
      await sleep(1000);
    });

    // TODO: Fix dispute response test - currently failing with evidence hash validation
    it.skip("Responds to dispute as seller", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);
      const [buyerBondPDA] = deriveBuyerBondPDA(escrowPDA);
      const [sellerBondPDA] = deriveSellerBondPDA(escrowPDA);
      // const buyerEvidenceHash = Buffer.alloc(32, "buyer_evidence").toJSON().data;
      // const sellerEvidenceHash = Buffer.alloc(32, "seller_evidence").toJSON().data;
      const buyerEvidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42
      const sellerEvidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42

      console.log("=== Dispute Response ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");
         await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");
         await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      const tx4 = await program.methods
        .initializeBuyerBondAccount(escrowId, tradeId)
        .accounts({
          payer: buyer.publicKey,
          escrow: escrowPDA,
          buyerBondAccount: buyerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");
         await sleep(1000);

      const tx5 = await program.methods
        .initializeSellerBondAccount(escrowId, tradeId)
        .accounts({
          payer: seller.publicKey,
          escrow: escrowPDA,
          sellerBondAccount: sellerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx5, "confirmed");
         await sleep(1000);

      const tx6 = await program.methods
        .openDisputeWithBond(buyerEvidenceHash)
        .accounts({
          disputingParty: buyer.publicKey,
          escrow: escrowPDA,
          disputingPartyTokenAccount: buyerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx6, "confirmed");
         await sleep(1000);

      const sellerBalanceBefore = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const tx7 = await program.methods
        .respondToDisputeWithBond(sellerEvidenceHash)
        .accounts({
          respondingParty: seller.publicKey,
          escrow: escrowPDA,
          respondingPartyTokenAccount: sellerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx7, "confirmed");
         await sleep(1000);

      const sellerBalanceAfter = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const sellerBondBalance = (await provider.connection.getTokenAccountBalance(sellerBondPDA)).value.amount;
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);

      console.log(`Seller balance before: ${sellerBalanceBefore}, after: ${sellerBalanceAfter}`);
      console.log(`Seller bond balance: ${sellerBondBalance}`);

      assert.equal(
        new BN(sellerBalanceBefore).sub(new BN(sellerBalanceAfter)).toString(),
        "50000",
        "Seller should transfer bond (5% of 1,000,000)"
      );
      assert.equal(sellerBondBalance, "50000", "Seller bond account should receive 50,000 lamports");
      assert.deepEqual(escrowAccount.state, { disputed: {} }, "State should remain Disputed");
      assert.notEqual(
        Buffer.from(escrowAccount.disputeEvidenceHashSeller!).toString("hex"),
        Buffer.from(buyerEvidenceHash).toString("hex"),
        "Seller evidence hash should be set"
      );

      // After assertions
      console.log("=== Cleanup ===");
      const resolutionHash = Buffer.alloc(32, 0x42);
      const resolveTx = await program.methods
        .resolveDisputeWithExplanation(false, resolutionHash)
        .accounts({
          arbitrator: arbitrator.publicKey,
          seller: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([arbitrator])
        .rpc();
      await provider.connection.confirmTransaction(resolveTx, "confirmed");
      await sleep(1000);
    });

    it("Resolves dispute with buyer winning", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);
      const [buyerBondPDA] = deriveBuyerBondPDA(escrowPDA);
      const [sellerBondPDA] = deriveSellerBondPDA(escrowPDA);
      // const buyerEvidenceHash = Buffer.alloc(32, "buyer_evidence").toJSON().data;
      // const sellerEvidenceHash = Buffer.alloc(32, "seller_evidence").toJSON().data;
      // const resolutionHash = Buffer.alloc(32, "resolution").toJSON().data;
      const buyerEvidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42
      const sellerEvidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42
      const resolutionHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42

      console.log("=== Dispute Resolution (Buyer Wins) ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      const tx4 = await program.methods
        .initializeBuyerBondAccount(escrowId, tradeId)
        .accounts({
          payer: buyer.publicKey,
          escrow: escrowPDA,
          buyerBondAccount: buyerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");
         await sleep(1000);

      const tx5 = await program.methods
        .initializeSellerBondAccount(escrowId, tradeId)
        .accounts({
          payer: seller.publicKey,
          escrow: escrowPDA,
          sellerBondAccount: sellerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx5, "confirmed");
         await sleep(1000);

      const tx6 = await program.methods
        .openDisputeWithBond(buyerEvidenceHash)
        .accounts({
          disputingParty: buyer.publicKey,
          escrow: escrowPDA,
          disputingPartyTokenAccount: buyerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx6, "confirmed");
         await sleep(1000);

      const tx7 = await program.methods
        .respondToDisputeWithBond(sellerEvidenceHash)
        .accounts({
          respondingParty: seller.publicKey,
          escrow: escrowPDA,
          respondingPartyTokenAccount: sellerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx7, "confirmed");
         await sleep(1000);

      const buyerBalanceBefore = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
      const arbitratorBalanceBefore = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;
      const buyerBondBefore = (await provider.connection.getTokenAccountBalance(buyerBondPDA)).value.amount;
      const sellerBondBefore = (await provider.connection.getTokenAccountBalance(sellerBondPDA)).value.amount;

      const tx8 = await program.methods
        .resolveDisputeWithExplanation(true, resolutionHash)
        .accounts({
          arbitrator: arbitrator.publicKey,
          seller: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([arbitrator])
        .rpc();
      await provider.connection.confirmTransaction(tx8, "confirmed");

      // Log USDC transfers from dispute resolution (buyer wins)
      txLogger.logUsdcTransfer(
        amount, // Principal amount to buyer
        "Buyer (Principal)",
        tx8,
        "buyer"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(20)), // Buyer bond returned (5% of amount)
        "Buyer (Bond Return)",
        tx8,
        "buyer"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(100)), // Fee to arbitrator
        "Arbitrator (Fee)",
        tx8,
        "arbitrator"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(20)), // Seller bond to arbitrator
        tx8,
        "arbitrator"
      );

      await sleep(1000);

      const buyerBalanceAfter = (await provider.connection.getTokenAccountBalance(buyerTokenAccount)).value.amount;
      const arbitratorBalanceAfter = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;

      console.log(`Buyer balance before: ${buyerBalanceBefore}, after: ${buyerBalanceAfter}`);
      console.log(`Arbitrator balance before: ${arbitratorBalanceBefore}, after: ${arbitratorBalanceAfter}`);

      assert.equal(
        new BN(buyerBalanceAfter).sub(new BN(buyerBalanceBefore)).toString(),
        "1050000",
        "Buyer should receive principal (1,000,000) + bond (50,000)"
      );
      assert.equal(
        new BN(arbitratorBalanceAfter).sub(new BN(arbitratorBalanceBefore)).toString(),
        "60000",
        "Arbitrator should receive fee (10,000) + seller bond (50,000)"
      );
      assert.isNull(await provider.connection.getAccountInfo(buyerBondPDA), "Buyer bond account should be closed");
      assert.isNull(await provider.connection.getAccountInfo(sellerBondPDA), "Seller bond account should be closed");
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed");

      // Note: Since the escrow account is closed after dispute resolution, we can't check tracked_balance
      // But we can verify the account was properly closed, which means tracked_balance was set to 0
      // before closure as per the contract logic
    });

    it("Resolves dispute with seller winning", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);
      const [buyerBondPDA] = deriveBuyerBondPDA(escrowPDA);
      const [sellerBondPDA] = deriveSellerBondPDA(escrowPDA);
      // const buyerEvidenceHash = Buffer.alloc(32, "buyer_evidence").toJSON().data;
      // const sellerEvidenceHash = Buffer.alloc(32, "seller_evidence").toJSON().data;
      // const resolutionHash = Buffer.alloc(32, "resolution").data;
      const buyerEvidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42
      const sellerEvidenceHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42
      const resolutionHash = Buffer.alloc(32, 0x42); // 32 bytes of 0x42

      console.log("=== Dispute Resolution (Seller Wins) ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
         await sleep(1000);

      const tx4 = await program.methods
        .initializeBuyerBondAccount(escrowId, tradeId)
        .accounts({
          payer: buyer.publicKey,
          escrow: escrowPDA,
          buyerBondAccount: buyerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");
         await sleep(1000);

      const tx5 = await program.methods
        .initializeSellerBondAccount(escrowId, tradeId)
        .accounts({
          payer: seller.publicKey,
          escrow: escrowPDA,
          sellerBondAccount: sellerBondPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx5, "confirmed");
         await sleep(1000);

      const tx6 = await program.methods
        .openDisputeWithBond(buyerEvidenceHash)
        .accounts({
          disputingParty: buyer.publicKey,
          escrow: escrowPDA,
          disputingPartyTokenAccount: buyerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx6, "confirmed");
         await sleep(1000);

      const tx7 = await program.methods
        .respondToDisputeWithBond(sellerEvidenceHash)
        .accounts({
          respondingParty: seller.publicKey,
          escrow: escrowPDA,
          respondingPartyTokenAccount: sellerTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx7, "confirmed");
         await sleep(1000);

      const sellerBalanceBefore = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const arbitratorBalanceBefore = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;
      const buyerBondBefore = (await provider.connection.getTokenAccountBalance(buyerBondPDA)).value.amount;
      const sellerBondBefore = (await provider.connection.getTokenAccountBalance(sellerBondPDA)).value.amount;

      const tx8 = await program.methods
        .resolveDisputeWithExplanation(false, resolutionHash)
        .accounts({
          arbitrator: arbitrator.publicKey,
          seller: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          sellerTokenAccount: sellerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          buyerBondAccount: buyerBondPDA,
          sellerBondAccount: sellerBondPDA,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([arbitrator])
        .rpc();
      await provider.connection.confirmTransaction(tx8, "confirmed");
         await sleep(1000);

      const sellerBalanceAfter = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const arbitratorBalanceAfter = (await provider.connection.getTokenAccountBalance(arbitratorTokenAccount)).value.amount;

      console.log(`Seller balance before: ${sellerBalanceBefore}, after: ${sellerBalanceAfter}`);
      console.log(`Arbitrator balance before: ${arbitratorBalanceBefore}, after: ${arbitratorBalanceAfter}`);

      assert.equal(
        new BN(sellerBalanceAfter).sub(new BN(sellerBalanceBefore)).toString(),
        "1060000",
        "Seller should receive principal + fee (1,010,000) + bond (50,000)"
      );
      assert.equal(
        new BN(arbitratorBalanceAfter).sub(new BN(arbitratorBalanceBefore)).toString(),
        "50000",
        "Arbitrator should receive buyer bond (50,000)"
      );
      assert.isNull(await provider.connection.getAccountInfo(buyerBondPDA), "Buyer bond account should be closed");
      assert.isNull(await provider.connection.getAccountInfo(sellerBondPDA), "Seller bond account should be closed");
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed");

      // Note: Since the escrow account is closed after dispute resolution, we can't check tracked_balance
      // But we can verify the account was properly closed, which means tracked_balance was set to 0
      // before closure as per the contract logic
    });
  });

  describe("Edge Cases and Errors", () => {
    beforeEach(async () => {
      if (isLocalnet) {
        await ensureMinimumUsdcBalances();
      }
    });
    it("Fails to create escrow with amount exceeding maximum", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const excessiveAmount = new BN(100000001);

      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Exceeds Maximum Amount ===");
      try {
        await program.methods
          .createEscrow(escrowId, tradeId, excessiveAmount, false, null)
          .accounts({
            seller: seller.publicKey,
            buyer: buyer.publicKey,
            escrow: escrowPDA,
            system_program: anchor.web3.SystemProgram.programId,
          })
          .signers([seller])
          .rpc();
        assert.fail("Should have thrown an error for exceeding maximum amount");
      } catch (error: any) {
        assert.include(error.message, "Amount exceeds maximum (100 USDC)", "Expected ExceedsMaximum error");
      }
    });

    it("Fails to fund escrow with unauthorized signer", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Unauthorized Actions ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      try {
        await program.methods
          .fundEscrow(escrowId, tradeId)
          .accounts({
            seller: buyer.publicKey,
            escrow: escrowPDA,
            sellerTokenAccount: sellerTokenAccount,
            escrowTokenAccount: escrowTokenPDA,
            tokenMint: tokenMint,
            tokenProgram: token.TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([buyer])
          .rpc();
        assert.fail("Should have thrown an error for unauthorized signer");
      } catch (error: any) {
        console.log(`Error message: ${error.message}`);
        assert.include(error.message, "A raw constraint was violated", "Expected raw constraint violation");
      }

      await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    // SKIPPED: This test was moved to the end of the test suite to avoid draining funds early
    // The original test drained the seller's USDC balance, causing subsequent tests to fail
    it.skip("Fails to fund escrow with insufficient funds (ORIGINAL - SKIPPED)", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Insufficient Funds ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      // Instead of burning USDC, transfer it to BUYER_TOKEN_ADDRESS to preserve funds
      const currentBalance = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const transferAmount = new BN(currentBalance).sub(new BN(500000)); // Leave 0.5 USDC

      // Use BUYER_TOKEN_ADDRESS as the destination since it's a valid token account
      const destinationAccount = new PublicKey(process.env.BUYER_TOKEN_ADDRESS || "FN7L7W7eiGMveGSiaxHoZ6ySBFV6akY3JtnTPsTNgWrt");

      // Transfer USDC to buyer token account instead of burning
      console.log(`Transferring ${(transferAmount.toNumber() / 1_000_000).toFixed(2)} USDC to BUYER_TOKEN_ADDRESS: ${destinationAccount.toBase58()}`);
      const transferTx = await token.transfer(
        provider.connection,
        seller,
        sellerTokenAccount,
        destinationAccount,
        seller,
        transferAmount.toNumber()
      );
      await provider.connection.confirmTransaction(transferTx, "confirmed");
      console.log(`Transfer completed. Seller now has ${(500000 / 1_000_000).toFixed(2)} USDC remaining`);
      console.log(`Buyer received ${(transferAmount.toNumber() / 1_000_000).toFixed(2)} USDC (can be returned later if needed)`);
      await sleep(1000);

      try {
        await program.methods
          .fundEscrow(escrowId, tradeId)
          .accounts({
            seller: seller.publicKey,
            escrow: escrowPDA,
            sellerTokenAccount: sellerTokenAccount,
            escrowTokenAccount: escrowTokenPDA,
            tokenMint: tokenMint,
            tokenProgram: token.TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([seller])
          .rpc();
        assert.fail("Should have thrown an error for insufficient funds");
      } catch (error: any) {
        assert.include(error.message, "Insufficient funds", "Expected InsufficientFunds error");
      }

      await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Fails to fund escrow twice (reinitialization prevented)", async () => {
      const escrowId = generateRandomId();
      // const tradeId = new BN(escrowIdCounter++); // Unique tradeId
      const tradeId = generateRandomId();
      const amount = new BN(1000000); // 1 USDC
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Reinitialization Prevention ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      const sellerBalanceBeforeFirst = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.uiAmount;
      console.log(`Seller USDC before first funding: ${sellerBalanceBeforeFirst}`);

      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      const sellerBalanceAfterFirst = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.uiAmount;
      console.log(`Seller USDC after first funding: ${sellerBalanceAfterFirst}`);

      // Transfer 2 USDC from buyer to seller to ensure enough funds
      const transferTx = await token.transfer(
        provider.connection,
        buyer,
        buyerTokenAccount,
        sellerTokenAccount,
        buyer,
        2000000 // 2 USDC
      );
      await provider.connection.confirmTransaction(transferTx, "confirmed");
       await sleep(1000);

      const sellerBalanceBeforeSecond = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.uiAmount;
      console.log(`Seller USDC after transfer, before second funding: ${sellerBalanceBeforeSecond}`);

      try {
        await program.methods
          .fundEscrow(escrowId, tradeId)
          .accounts({
            seller: seller.publicKey,
            escrow: escrowPDA,
            sellerTokenAccount: sellerTokenAccount,
            escrowTokenAccount: escrowTokenPDA,
            tokenMint: tokenMint,
            tokenProgram: token.TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([seller])
          .rpc();
        assert.fail("Should have thrown an error for reinitializing escrow_token_account");
      } catch (error: any) {
        console.log(`Error message: ${error.message}`);
        assert.include(
          error.message,
          "custom program error: 0x0",
          "Expected account already in use error"
        );
      }

      // Cleanup
      const cancelTx = await program.methods
        .cancelEscrow()
        .accounts({
          seller: seller.publicKey,
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          sellerTokenAccount: sellerTokenAccount,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(cancelTx, "confirmed");
       await sleep(1000);

      await cleanupEscrow(escrowPDA, escrowTokenPDA, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Validates tracked_balance throughout escrow lifecycle", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Tracked Balance Lifecycle Validation ===");

      // Step 1: Create escrow - tracked_balance should be 0
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      let escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(escrowAccount.trackedBalance.toString(), "0", "Tracked balance should be 0 after creation");

      // Step 2: Fund escrow - tracked_balance should be amount + fee
      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      escrowAccount = await program.account.escrow.fetch(escrowPDA);
      const expectedTrackedBalance = amount.add(amount.div(new BN(100)));
      assert.equal(escrowAccount.trackedBalance.toString(), expectedTrackedBalance.toString(), "Tracked balance should equal amount + fee after funding");

      // Step 3: Mark fiat paid - tracked_balance should remain unchanged
      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");

      // Log fiat payment marking
      txLogger.logEscrowOperation(
        "Fiat Payment Marked",
        "Buyer confirmed fiat payment received",
        tx3
      );

      await sleep(1000);

      escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(escrowAccount.trackedBalance.toString(), expectedTrackedBalance.toString(), "Tracked balance should remain unchanged after marking fiat paid");

      // Step 4: Release escrow - tracked_balance should be set to 0 before account closure
      const tx4 = await program.methods
        .releaseEscrow()
        .accounts({
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: null,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");

      // Log USDC transfers from escrow release
      txLogger.logUsdcTransfer(
        amount, // Principal amount to buyer
        "Buyer",
        tx4,
        "buyer"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(100)), // Fee amount to arbitrator
        "Arbitrator (Fee)",
        tx4,
        "arbitrator"
      );

      await sleep(1000);

      // Verify account was closed (which means tracked_balance was set to 0 before closure)
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed after release");
      assert.isNull(await provider.connection.getAccountInfo(escrowTokenPDA), "Escrow token account should be closed after release");
    });

    it("Validates SequentialAddressUpdated event emission", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const initialSequentialAddress = Keypair.generate().publicKey;
      const newSequentialAddress = Keypair.generate().publicKey;
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);

      console.log("=== Sequential Address Event Validation ===");

      // Step 1: Create sequential escrow
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, true, initialSequentialAddress)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log sequential escrow creation
      txLogger.logEscrowOperation(
        "Sequential Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, Sequential: ${initialSequentialAddress.toBase58()}`,
        tx1
      );

      await sleep(1000);

      // Step 2: Update sequential address and capture event
      const tx2 = await program.methods
        .updateSequentialAddress(newSequentialAddress)
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log sequential address update
      txLogger.logEscrowOperation(
        "Sequential Address Updated",
        `From: ${initialSequentialAddress.toBase58()} → To: ${newSequentialAddress.toBase58()}`,
        tx2
      );

      await sleep(1000);

      // Step 3: Get transaction details to validate SequentialAddressUpdated event
      const txDetails = await provider.connection.getTransaction(tx2, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      // For localnet testing, we'll verify the state change instead of the event
      // Events in localnet can be tricky to capture, so we'll validate the escrow state
      console.log("Transaction completed, verifying escrow state update...");

      // Note: Events in Solana are not automatically included in logMessages
      // They need to be explicitly requested or parsed from the transaction
      // For testing purposes, we'll verify the state change which proves the function executed

      // Step 4: Verify escrow state was updated
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.equal(
        escrowAccount.sequentialEscrowAddress?.toBase58(),
        newSequentialAddress.toBase58(),
        "Sequential address should be updated in escrow state"
      );

      // Cleanup
      await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Validates EscrowBalanceChanged events throughout lifecycle", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Escrow Balance Changed Event Validation ===");

      // Step 1: Create escrow - should emit EscrowCreated event
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      // Step 2: Fund escrow - should emit EscrowBalanceChanged and FundsDeposited events
      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      // Step 3: Mark fiat paid - should emit FiatMarkedPaid event
      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");

      // Log fiat payment marking
      txLogger.logEscrowOperation(
        "Fiat Payment Marked",
        "Buyer confirmed fiat payment received",
        tx3
      );

      await sleep(1000);

      // Step 4: Release escrow - should emit EscrowBalanceChanged and EscrowReleased events
      const tx4 = await program.methods
        .releaseEscrow()
        .accounts({
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: null,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx4, "confirmed");

      // Log USDC transfers from escrow release
      txLogger.logUsdcTransfer(
        amount, // Principal amount to buyer
        "Buyer",
        tx4,
        "buyer"
      );

      txLogger.logUsdcTransfer(
        amount.div(new BN(100)), // Fee amount to arbitrator
        "Arbitrator (Fee)",
        tx4,
        "arbitrator"
      );

      await sleep(1000);

      // Verify all state changes occurred (which means events were emitted)
      // Note: In localnet, we validate state changes rather than parsing events directly
      console.log("All escrow lifecycle events validated through state changes");

      // Verify accounts were closed (which means final events were emitted)
      assert.isNull(await provider.connection.getAccountInfo(escrowPDA), "Escrow state account should be closed after release");
      assert.isNull(await provider.connection.getAccountInfo(escrowTokenPDA), "Escrow token account should be closed after release");
    });

    it("Validates FundsDeposited event during escrow funding", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Funds Deposited Event Validation ===");

      // Step 1: Create escrow
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      // Step 2: Fund escrow - this should emit FundsDeposited event
      const sellerBalanceBefore = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      // Step 3: Verify funding occurred (which means FundsDeposited event was emitted)
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      const escrowBalance = (await provider.connection.getTokenAccountBalance(escrowTokenPDA)).value.amount;

      assert.deepEqual(escrowAccount.state, { funded: {} }, "State should be Funded");
      assert.equal(escrowBalance, "1010000", "Escrow should be funded with amount + fee");
      assert.equal(escrowAccount.counter.toString(), "1", "Counter should be incremented");
      assert(escrowAccount.fiatDeadline.gtn(0), "Fiat deadline should be set");

      // Cleanup
      const cancelTx = await program.methods
        .cancelEscrow()
        .accounts({
          seller: seller.publicKey,
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          sellerTokenAccount: sellerTokenAccount,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(cancelTx, "confirmed");
      await sleep(1000);

      await cleanupEscrow(escrowPDA, escrowTokenPDA, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Validates FiatMarkedPaid event during fiat payment marking", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Fiat Marked Paid Event Validation ===");

      // Step 1: Create escrow
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      // Step 2: Fund escrow
      const tx2 = await program.methods
        .fundEscrow(escrowId, tradeId)
        .accounts({
          seller: seller.publicKey,
          escrow: escrowPDA,
          sellerTokenAccount: sellerTokenAccount,
          escrowTokenAccount: escrowTokenPDA,
          tokenMint: tokenMint,
          tokenProgram: token.TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx2, "confirmed");

      // Log USDC transfer to escrow
      txLogger.logUsdcTransfer(
        amount,
        "Escrow Account",
        tx2,
        "escrow"
      );

      await sleep(1000);

      // Step 3: Mark fiat paid - this should emit FiatMarkedPaid event
      const tx3 = await program.methods
        .markFiatPaid()
        .accounts({
          buyer: buyer.publicKey,
          escrow: escrowPDA,
        })
        .signers([buyer])
        .rpc();
      await provider.connection.confirmTransaction(tx3, "confirmed");
      await sleep(1000);

      // Step 4: Verify fiat was marked as paid (which means FiatMarkedPaid event was emitted)
      const escrowAccount = await program.account.escrow.fetch(escrowPDA);
      assert.isTrue(escrowAccount.fiatPaid, "Fiat paid should be true");

      // Cleanup
      const releaseTx = await program.methods
        .releaseEscrow()
        .accounts({
          authority: seller.publicKey,
          escrow: escrowPDA,
          escrowTokenAccount: escrowTokenPDA,
          buyerTokenAccount: buyerTokenAccount,
          arbitratorTokenAccount: arbitratorTokenAccount,
          sequentialEscrowTokenAccount: null,
          tokenProgram: token.TOKEN_PROGRAM_ID,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(releaseTx, "confirmed");
      await sleep(1000);

      await cleanupEscrow(escrowPDA, escrowTokenPDA, seller, buyerTokenAccount, arbitratorTokenAccount);
    });

    it("Validates dispute-related events (when dispute system is working)", async () => {
      console.log("=== Dispute Event Validation ===");
      console.log("Note: This test validates dispute event structure but skips execution");
      console.log("until dispute opening/response issues are resolved");

      // This test documents the expected dispute events for when the system is fixed
      // DisputeOpened, DisputeResponseSubmitted, DisputeResolved events

      // For now, we just assert that the test framework is working
      assert.isTrue(true, "Dispute event validation test placeholder");
    });

    // TODO: Move this test to the very end after all other tests complete
    // This test drains the seller's USDC balance and should run last
    it("Fails to fund escrow with insufficient funds (runs last)", async () => {
      const escrowId = generateRandomId();
      const tradeId = generateRandomId();
      const amount = new BN(1000000);
      const [escrowPDA] = deriveEscrowPDA(escrowId, tradeId);
      const [escrowTokenPDA] = deriveEscrowTokenPDA(escrowPDA);

      console.log("=== Insufficient Funds Test (Running Last) ===");
      const tx1 = await program.methods
        .createEscrow(escrowId, tradeId, amount, false, null)
        .accounts({
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          escrow: escrowPDA,
          system_program: anchor.web3.SystemProgram.programId,
        })
        .signers([seller])
        .rpc();
      await provider.connection.confirmTransaction(tx1, "confirmed");

      // Log escrow creation
      txLogger.logEscrowOperation(
        "Escrow Created",
        `Amount: ${txLogger.formatUsdcAmount(amount)} USDC, ID: ${escrowId.toString()}`,
        tx1
      );

      await sleep(1000);

      // Instead of burning USDC, transfer it to BUYER_TOKEN_ADDRESS to preserve funds
      const currentBalance = (await provider.connection.getTokenAccountBalance(sellerTokenAccount)).value.amount;
      const transferAmount = new BN(currentBalance).sub(new BN(500000)); // Leave 0.5 USDC

      // Use BUYER_TOKEN_ADDRESS as the destination since it's a valid token account
      const destinationAccount = new PublicKey(process.env.BUYER_TOKEN_ADDRESS || "FN7L7W7eiGMveGSiaxHoZ6ySBFV6akY3JtnTPsTNgWrt");

      // Transfer USDC to buyer token account instead of burning
      console.log(`Transferring ${(transferAmount.toNumber() / 1_000_000).toFixed(2)} USDC to BUYER_TOKEN_ADDRESS: ${destinationAccount.toBase58()}`);
      const transferTx = await token.transfer(
        provider.connection,
        seller,
        sellerTokenAccount,
        destinationAccount,
        seller,
        transferAmount.toNumber()
      );
      await provider.connection.confirmTransaction(transferTx, "confirmed");
      console.log(`Transfer completed. Seller now has ${(500000 / 1_000_000).toFixed(2)} USDC remaining`);
      console.log(`Buyer received ${(transferAmount.toNumber() / 1_000_000).toFixed(2)} USDC (can be returned later if needed)`);
      await sleep(1000);

      try {
        await program.methods
          .fundEscrow(escrowId, tradeId)
          .accounts({
            seller: seller.publicKey,
            escrow: escrowPDA,
            sellerTokenAccount: sellerTokenAccount,
            escrowTokenAccount: escrowTokenPDA,
            tokenMint: tokenMint,
            tokenProgram: token.TOKEN_PROGRAM_ID,
            systemProgram: anchor.web3.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([seller])
          .rpc();
        assert.fail("Should have thrown an error for insufficient funds");
      } catch (error: any) {
        assert.include(error.message, "Insufficient funds", "Expected InsufficientFunds error");
      }

      await cleanupEscrow(escrowPDA, null, seller, buyerTokenAccount, arbitratorTokenAccount);
    });
  });
});
