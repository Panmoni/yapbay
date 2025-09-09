/*
 * LOCAL SOLANA ESCROW CONTRACT version 0.1.2
 *
 * This is a decentralized escrow service built on Solana that enables secure peer-to-peer
 * trading with automated dispute resolution. The contract acts as a trusted intermediary
 * that holds funds until trade conditions are met.
 *
 * HOW IT WORKS:
 *
 * 1. ESCROW CREATION & FUNDING:
 *    - Seller creates an escrow with trade details (amount, deadlines, sequential trade support)
 *    - Seller funds the escrow with principal + 1% fee
 *    - 15-minute deposit deadline for funding, 30-minute fiat payment deadline
 *
 * 2. TRADE EXECUTION:
 *    - Buyer marks fiat payment as completed
 *    - Seller can then release funds to buyer (or next sequential escrow)
 *    - Supports sequential trades where funds flow to another escrow
 *
 * 3. DISPUTE RESOLUTION:
 *    - Either party can open a dispute by posting a 5% bond
 *    - Both parties submit evidence hashes and bonds
 *    - 72-hour response deadline for non-initiating party
 *    - Arbitrator makes final decision within 7 days
 *    - Winner gets their bond back, loser's bond goes to platform
 *
 * 4. AUTOMATED SAFEGUARDS:
 *    - Auto-cancellation if deadlines expire
 *    - Default judgment if one party doesn't respond to dispute
 *    - Secure PDA-based token accounts with proper authority controls
 *
 * KEY FEATURES:
 * - Maximum trade size: 100 USDC
 * - 1% platform fee on all trades
 * - 5% dispute bond requirement
 * - Sequential trade support for complex trading flows
 * - Comprehensive event logging for off-chain indexing
 * - Rent refunds to reduce user costs
 *
 * SECURITY:
 * - Only authorized parties can perform actions
 * - PDA-derived addresses prevent address spoofing
 * - Proper state machine prevents invalid transitions
 * - Bond system discourages frivolous disputes
 *
 * This contract enables trustless trading while providing robust dispute resolution
 * mechanisms, making it suitable for P2P commerce, OTC trading, and other
 * scenarios requiring secure escrow services.
 */

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, CloseAccount};

declare_id!("4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x");

mod constants {
    // Maximum amount allowed (100 USDC)
    pub const MAX_AMOUNT: u64 = 100_000_000; // 6 decimals for USDC

    // Fee percentage (1%)
    pub const FEE_BASIS_POINTS: u64 = 100; // 1% = 100 basis points

    // Dispute bond percentage (5%)
    pub const DISPUTE_BOND_BASIS_POINTS: u64 = 500; // 5% = 500 basis points

    // Production Deadlines
    pub const DEPOSIT_DEADLINE_MINUTES: i64 = 15; // 15 minutes from order initiation
    pub const FIAT_DEADLINE_MINUTES: i64 = 30;    // 30 minutes after funding

    // Shorten deadlines for localnet testing
    // pub const DEPOSIT_DEADLINE_MINUTES: i64 = 1;
    // pub const FIAT_DEADLINE_MINUTES: i64 = 1;

    pub const DISPUTE_RESPONSE_DEADLINE_HOURS: i64 = 72; // 72 hours to respond to dispute
    pub const ARBITRATION_DEADLINE_HOURS: i64 = 168;     // 7 days for arbitrator to make decision

    // Hardcoded arbitrator Pubkey (base58: GGrXhNVxUZXaA2uMopsa5q23aPmoNvQF14uxqo8qENUr)
    pub const ARBITRATOR_BYTES: [u8; 32] =
    [0xe2, 0xef, 0x04, 0xd8, 0x35, 0x5b, 0x03, 0xd1, 0xdb, 0x14, 0x87, 0x9e, 0x38, 0x84, 0x4d, 0x64, 0x74, 0xc7, 0x8b, 0xe4, 0xbe, 0x4e, 0x31, 0xb4, 0xae, 0xfe, 0x13, 0xc8, 0x2f, 0xdb, 0xdb, 0x2b];

    // Other constants
    pub const SECONDS_PER_MINUTE: i64 = 60;
    pub const SECONDS_PER_HOUR: i64 = 3600;

    pub const MAX_U64: u64 = u64::MAX; // 18,446,744,073,709,551,615
}

// Custom error codes
#[error_code]
pub enum EscrowError {
    #[msg("Invalid amount: Zero or negative")]
    InvalidAmount,
    #[msg("Amount exceeds maximum (100 USDC)")]
    ExceedsMaximum,
    #[msg("Unauthorized caller")]
    Unauthorized,
    #[msg("Deposit deadline expired")]
    DepositDeadlineExpired,
    #[msg("Fiat payment deadline expired")]
    FiatDeadlineExpired,
    #[msg("Invalid state transition")]
    InvalidState,
    #[msg("Missing sequential escrow address")]
    MissingSequentialAddress,
    #[msg("Already in terminal state")]
    TerminalState,
    #[msg("Fee calculation error")]
    FeeCalculationError,
    #[msg("Insufficient funds to cover principal and fee")]
    InsufficientFunds,
    #[msg("Dispute bond amount incorrect")]
    IncorrectBondAmount,
    #[msg("Dispute response deadline expired")]
    ResponseDeadlineExpired,
    #[msg("Evidence hash missing or invalid")]
    InvalidEvidenceHash,
    #[msg("Duplicate evidence submission")]
    DuplicateEvidence,
    #[msg("Arbitration deadline expired")]
    ArbitrationDeadlineExpired,
    #[msg("Missing dispute bond")]
    MissingDisputeBond,
    #[msg("Invalid resolution explanation")]
    InvalidResolutionExplanation,
    #[msg("Required bump seed not found")]
    BumpNotFound,
}

#[program]
pub mod localsolana_contracts {
    use super::*;
    use constants::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        escrow_id: u64,
        trade_id: u64,
        amount: u64,
        sequential: bool,
        sequential_escrow_address: Option<Pubkey>,
    ) -> Result<()> {

        // debugging borsch
        // msg!("Escrow size (memory): {}", std::mem::size_of::<Escrow>());
        // msg!("Allocated space: {}", ctx.accounts.escrow.to_account_info().data_len()); // Should be 337
        // msg!("Starting initialization");

        // Validate amount
        require!(amount > 0, EscrowError::InvalidAmount);
        require!(amount <= MAX_AMOUNT, EscrowError::ExceedsMaximum);

        // Validate sequential address if sequential is true
        if sequential {
            require!(sequential_escrow_address.is_some(), EscrowError::MissingSequentialAddress);
        }

        // Calculate fee (1% of principal)
        let fee = amount
            .checked_mul(FEE_BASIS_POINTS)
            .ok_or(EscrowError::FeeCalculationError)?
            .checked_div(10000)
            .ok_or(EscrowError::FeeCalculationError)?;

        // Calculate deposit deadline (current time + 15 minutes)
        let current_time = Clock::get()?.unix_timestamp;
        let deposit_deadline = current_time
            .checked_add(DEPOSIT_DEADLINE_MINUTES * SECONDS_PER_MINUTE)
            .ok_or(EscrowError::FeeCalculationError)?;

        // Store seller/buyer/arbitrator info
        let seller_key = ctx.accounts.seller.key();
        let buyer_key = ctx.accounts.buyer.key();

         let arbitrator = Pubkey::new_from_array(ARBITRATOR_BYTES);

        // Initialize escrow
        let escrow = &mut ctx.accounts.escrow;
        // msg!("Before escrow assignment");
        escrow.escrow_id = escrow_id;
        escrow.trade_id = trade_id;
        escrow.seller = seller_key;
        escrow.buyer = buyer_key;
        escrow.arbitrator = arbitrator;
        escrow.amount = amount;
        escrow.fee = fee;
        escrow.deposit_deadline = deposit_deadline;
        escrow.fiat_deadline = 0; // Will be set when funded
        escrow.state = EscrowState::Created;
        escrow.sequential = sequential;
        escrow.sequential_escrow_address = sequential_escrow_address;
        escrow.fiat_paid = false;
        escrow.counter = 0;
        escrow.dispute_initiator = None;
        escrow.dispute_initiated_time = None;
        escrow.dispute_evidence_hash_buyer = None;
        escrow.dispute_evidence_hash_seller = None;
        escrow.dispute_resolution_hash = None;
        // msg!("After escrow assignment");

        // Log the escrow data after initialization
        // msg!("Escrow data: {:?}", escrow);

        // Get escrow key for event
        let escrow_key = escrow.key();

        // initiatialize tracked balance
        escrow.tracked_balance = 0;

        emit!(EscrowCreated {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            seller: seller_key,
            buyer: buyer_key,
            arbitrator,
            amount,
            fee,
            deposit_deadline,
            fiat_deadline: 0,
            sequential,
            sequential_escrow_address,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>, _escrow_id: u64, _trade_id: u64) -> Result<()> {

        use constants::MAX_U64;

        // pull up vars
        let escrow = &mut ctx.accounts.escrow;
        let escrow_key = escrow.key();
        let escrow_id = escrow.escrow_id;
        let trade_id = escrow.trade_id;
        let amount = escrow.amount;
        let fee = escrow.fee;
        let state = escrow.state;
        let deposit_deadline = escrow.deposit_deadline;
        let seller_key = escrow.seller;

        // Verify escrow state
        require!(state == EscrowState::Created, EscrowError::InvalidState);

        // Verify deposit deadline
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time <= deposit_deadline, EscrowError::DepositDeadlineExpired);

        // Verify caller is seller
        require!(ctx.accounts.seller.key() == seller_key, EscrowError::Unauthorized);

        let total_amount = amount
            .checked_add(fee)
            .ok_or(EscrowError::FeeCalculationError)?
            .min(MAX_U64);

        // Ensure provided token account has sufficient funds
        require!(
            ctx.accounts.seller_token_account.amount >= total_amount,
            EscrowError::InsufficientFunds
        );

        // Transfer funds from seller to escrow token account
        // Cpi: cross program invocation
        let transfer_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );

        token::transfer(transfer_context, total_amount)?;

        // Set fiat deadline (current time + 30 minutes)
        let fiat_deadline = current_time
            .checked_add(FIAT_DEADLINE_MINUTES * SECONDS_PER_MINUTE)
            .ok_or(EscrowError::FeeCalculationError)?;

        // Update escrow state
        escrow.state = EscrowState::Funded;
        escrow.counter = escrow.counter.checked_add(1).unwrap();
        escrow.fiat_deadline = fiat_deadline;

        // Update tracked balance
        escrow.tracked_balance = total_amount;

        // Emit balance change event
        emit!(EscrowBalanceChanged {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            new_balance: total_amount,
            reason: "Escrow funded".to_string(),
            timestamp: current_time,
        });

        let counter = escrow.counter;

        emit!(FundsDeposited {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            amount,
            fee,
            counter,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn mark_fiat_paid(ctx: Context<MarkFiatPaid>) -> Result<()> {
        // Verify escrow state
        require!(ctx.accounts.escrow.state == EscrowState::Funded, EscrowError::InvalidState);

        // Verify caller is buyer
        require!(ctx.accounts.buyer.key() == ctx.accounts.escrow.buyer, EscrowError::Unauthorized);

        // Verify fiat deadline
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time <= ctx.accounts.escrow.fiat_deadline, EscrowError::FiatDeadlineExpired);

        // Get escrow key and ids for event
        let escrow_key = ctx.accounts.escrow.key();
        let escrow_id = ctx.accounts.escrow.escrow_id;
        let trade_id = ctx.accounts.escrow.trade_id;

        // Update fiat_paid flag
        ctx.accounts.escrow.fiat_paid = true;

        emit!(FiatMarkedPaid {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn update_sequential_address(
        ctx: Context<UpdateSequentialAddress>,
        new_address: Pubkey,
    ) -> Result<()> {
        // Verify escrow is sequential
        require!(ctx.accounts.escrow.sequential, EscrowError::InvalidState);

        // Verify caller is buyer
        require!(ctx.accounts.buyer.key() == ctx.accounts.escrow.buyer, EscrowError::Unauthorized);

        // Verify escrow is not in terminal state
        let state = ctx.accounts.escrow.state;
        require!(
            state != EscrowState::Released &&
            state != EscrowState::Cancelled &&
            state != EscrowState::Resolved,
            EscrowError::TerminalState
        );

        let old_address = ctx.accounts.escrow.sequential_escrow_address;

        // Update sequential escrow address
        ctx.accounts.escrow.sequential_escrow_address = Some(new_address);

        let escrow_id = ctx.accounts.escrow.escrow_id;
        let current_time = Clock::get()?.unix_timestamp;
        let escrow_key = ctx.accounts.escrow.key();
        let trade_id = ctx.accounts.escrow.trade_id;

        // Emit event for sequential escrow address change
        emit!(SequentialAddressUpdated {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            old_address,
            new_address,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {

        // pull up vars
        let escrow = &mut ctx.accounts.escrow;
        let escrow_key = escrow.key();
        let escrow_id = escrow.escrow_id;
        let trade_id = escrow.trade_id;
        let amount = escrow.amount;
        let fee = escrow.fee;
        let state = escrow.state;
        let seller = escrow.seller;
        let arbitrator = escrow.arbitrator;
        let fiat_paid = escrow.fiat_paid;
        let is_sequential = escrow.sequential;
        let sequential_escrow_address = escrow.sequential_escrow_address;
        let buyer = escrow.buyer;

        // Verify escrow state
        require!(state == EscrowState::Funded, EscrowError::InvalidState);

        // Verify caller is seller or arbitrator
        let caller = ctx.accounts.authority.key();
        require!(
            caller == seller || caller == arbitrator,
            EscrowError::Unauthorized
        );

        // Verify fiat is marked as paid
        require!(fiat_paid, EscrowError::InvalidState);

        // For sequential trades, verify sequential_escrow_address exists
        if is_sequential {
            require!(sequential_escrow_address.is_some(), EscrowError::MissingSequentialAddress);
            require!(ctx.accounts.sequential_escrow_token_account.is_some(), EscrowError::MissingSequentialAddress);
        }

        let current_time = Clock::get()?.unix_timestamp;

        // Create PDA signer seeds
        let escrow_token_bump = ctx.bumps.escrow_token_account;
        let escrow_token_seeds = &[
            b"escrow_token".as_ref(),
            escrow_key.as_ref(),
            // bump is mandatory here, not optional, so no expect, as it is u8
            &[escrow_token_bump]
        ];

        // Create a slice containing a reference to the seeds
        let signer_seeds = &[&escrow_token_seeds[..]];

        // Transfer fee to arbitrator
        let fee_transfer_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.arbitrator_token_account.to_account_info(),
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            // &binding,
            signer_seeds,
        );

        token::transfer(fee_transfer_context, fee)?;

        // Transfer principal to buyer or sequential escrow
        let destination_account = if is_sequential {
            ctx.accounts.sequential_escrow_token_account.as_ref().unwrap().to_account_info()
        } else {
            ctx.accounts.buyer_token_account.to_account_info()
        };

        let signer_seeds = &[&escrow_token_seeds[..]];

        let principal_transfer_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: destination_account,
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(principal_transfer_context, amount)?;

        // Update tracked balance to zero
        escrow.tracked_balance = 0;

        // Emit balance change event
        emit!(EscrowBalanceChanged {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            new_balance: 0,
            reason: "Escrow released".to_string(),
            timestamp: current_time,
        });

        // Updated: Close escrow_token_account, refund rent to seller
        let close_token_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_token_account.to_account_info(),
                destination: ctx.accounts.authority.to_account_info(), // refund to authority
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );

        token::close_account(close_token_context)?;

        // Updated: Close escrow state account, refund rent to seller
        escrow.state = EscrowState::Released;
        escrow.counter = escrow.counter.checked_add(1).unwrap();
        let counter = escrow.counter;

        // Figure out destination for event
        let destination = if is_sequential {
            ctx.accounts.escrow.sequential_escrow_address.unwrap()
        } else {
            buyer
        };

        emit!(EscrowReleased {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            buyer,
            amount,
            fee,
            counter,
            timestamp: current_time,
            destination,
        });

        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {

        use constants::MAX_U64;

        // pull up vars
        let current_time = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        let escrow_key = escrow.key();
        let escrow_id = escrow.escrow_id;
        let trade_id = escrow.trade_id;
        let amount = escrow.amount;
        let fee = escrow.fee;
        let seller = escrow.seller;

        // Verify escrow state
        let current_state = escrow.state;
        require!(
            current_state == EscrowState::Created || current_state == EscrowState::Funded,
            EscrowError::InvalidState
        );

        // Verify caller is seller or arbitrator
        let caller = ctx.accounts.authority.key();
        require!(
            caller == escrow.seller || caller == escrow.arbitrator,
            EscrowError::Unauthorized
        );

        // Verify fiat is not marked as paid
        require!(!escrow.fiat_paid, EscrowError::InvalidState);

        // If escrow is funded, return funds to seller
        if current_state == EscrowState::Funded {
            // Ensure token accounts are present
            let escrow_token_account = ctx.accounts.escrow_token_account.as_ref()
                .ok_or(EscrowError::InvalidState)?;

            let seller_token_account = ctx.accounts.seller_token_account.as_ref()
                .ok_or(EscrowError::InvalidState)?;

            let total_amount = amount
                .checked_add(fee)
                .ok_or(EscrowError::FeeCalculationError)?
                .min(MAX_U64);

            let escrow_token_bump = ctx.bumps.escrow_token_account;
            let seeds = &[
                b"escrow_token".as_ref(),
                escrow_key.as_ref(),
                // Optional bump
                &[escrow_token_bump.expect("Bump not found for escrow_token_account")]
            ];

            let signer_seeds = &[&seeds[..]];

            let transfer_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: escrow_token_account.to_account_info(),
                    to: seller_token_account.to_account_info(),
                    authority: escrow_token_account.to_account_info(),
                },
                signer_seeds,
            );

            token::transfer(transfer_context, total_amount)?;

            // Set tracked balance to Zero
            escrow.tracked_balance = 0;

            // Emit escrow balance changed event
            emit!(EscrowBalanceChanged {
                object_id: escrow_key,
                escrow_id,
                trade_id,
                new_balance: 0,
                reason: "Escrow cancelled".to_string(),
                timestamp: current_time,
            });

            // Updated: Close escrow_token_account
            let close_token_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: escrow_token_account.to_account_info(),
                    destination: ctx.accounts.seller.to_account_info(),
                    authority: escrow_token_account.to_account_info(),
                },
                signer_seeds,
            );

            token::close_account(close_token_context)?;
        }

        // Update escrow state
        escrow.state = EscrowState::Cancelled;
        escrow.counter = escrow.counter.checked_add(1).unwrap();
        let counter = escrow.counter;

        emit!(EscrowCancelled {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            seller,
            amount,
            fee,
            counter,
            timestamp: current_time,
        });

        Ok(())
    }

    // new, re stack overflow error
    pub fn initialize_buyer_bond_account(
        _ctx: Context<InitializeBuyerBondAccount>,
        _escrow_id: u64,
        _trade_id: u64,
    ) -> Result<()> {
        // The account is initialized automatically through Anchor's account constraints
        Ok(())
    }

    pub fn initialize_seller_bond_account(
        _ctx: Context<InitializeSellerBondAccount>,
        _escrow_id: u64,
        _trade_id: u64,
    ) -> Result<()> {
        // The account is initialized automatically through Anchor's account constraints
        Ok(())
    }

    pub fn open_dispute_with_bond(
        ctx: Context<OpenDispute>,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        // Verify escrow state
        require!(ctx.accounts.escrow.state == EscrowState::Funded, EscrowError::InvalidState);

        // Verify fiat is marked as paid
        require!(ctx.accounts.escrow.fiat_paid, EscrowError::InvalidState);

        // Verify caller is buyer or seller
        let caller = ctx.accounts.disputing_party.key();
        let escrow_buyer = ctx.accounts.escrow.buyer;
        let escrow_seller = ctx.accounts.escrow.seller;
        require!(
            caller == escrow_buyer || caller == escrow_seller,
            EscrowError::Unauthorized
        );

        // Calculate bond amount (5% of transaction value)
        let amount = ctx.accounts.escrow.amount;
        let bond_amount = amount
            .checked_mul(DISPUTE_BOND_BASIS_POINTS)
            .ok_or(EscrowError::FeeCalculationError)?
            .checked_div(10000)
            .ok_or(EscrowError::FeeCalculationError)?;

        // Verify bond amount in token account
        require!(
            ctx.accounts.disputing_party_token_account.amount >= bond_amount,
            EscrowError::IncorrectBondAmount
        );

        let current_time = Clock::get()?.unix_timestamp;
        let escrow_key = ctx.accounts.escrow.key();
        let escrow_id = ctx.accounts.escrow.escrow_id;
        let trade_id = ctx.accounts.escrow.trade_id;

        // Update escrow state (dispute details)
        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Disputed;
        escrow.dispute_initiator = Some(caller);
        escrow.dispute_initiated_time = Some(current_time);

        // Store evidence hash in appropriate field
        if caller == escrow_buyer {
            escrow.dispute_evidence_hash_buyer = Some(evidence_hash);
        } else {
            escrow.dispute_evidence_hash_seller = Some(evidence_hash);
        }

        // Transfer bond to dispute bond account
        let bond_account = if caller == escrow_buyer {
            &ctx.accounts.buyer_bond_account
        } else {
            &ctx.accounts.seller_bond_account
        };

        let transfer_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.disputing_party_token_account.to_account_info(),
                to: bond_account.to_account_info(),
                authority: ctx.accounts.disputing_party.to_account_info(),
            },
        );

        token::transfer(transfer_context, bond_amount)?;

        emit!(DisputeOpened {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            disputing_party: caller,
            timestamp: current_time,
            evidence_hash,
            bond_amount,
        });

        Ok(())
    }

    pub fn respond_to_dispute_with_bond(
        ctx: Context<RespondToDispute>,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        // Verify escrow state
        require!(ctx.accounts.escrow.state == EscrowState::Disputed, EscrowError::InvalidState);

        // Verify dispute initiator exists
        let dispute_initiator_opt = ctx.accounts.escrow.dispute_initiator;
        require!(dispute_initiator_opt.is_some(), EscrowError::InvalidState);
        let dispute_initiator = dispute_initiator_opt.unwrap();

        // Verify caller is the non-initiating party
        let caller = ctx.accounts.responding_party.key();
        let escrow_buyer = ctx.accounts.escrow.buyer;
        let escrow_seller = ctx.accounts.escrow.seller;

        require!(
            caller != dispute_initiator && (caller == escrow_buyer || caller == escrow_seller),
            EscrowError::Unauthorized
        );

        // Verify response deadline
        let current_time = Clock::get()?.unix_timestamp;
        let dispute_initiated_time = ctx.accounts.escrow.dispute_initiated_time.unwrap();
        let response_deadline = dispute_initiated_time
            .checked_add(DISPUTE_RESPONSE_DEADLINE_HOURS * SECONDS_PER_HOUR)
            .ok_or(EscrowError::FeeCalculationError)?;

        require!(current_time <= response_deadline, EscrowError::ResponseDeadlineExpired);

        // Calculate bond amount (5% of transaction value)
        let amount = ctx.accounts.escrow.amount;
        let bond_amount = amount
            .checked_mul(DISPUTE_BOND_BASIS_POINTS)
            .ok_or(EscrowError::FeeCalculationError)?
            .checked_div(10000)
            .ok_or(EscrowError::FeeCalculationError)?;

        // Verify bond amount in token account
        require!(
            ctx.accounts.responding_party_token_account.amount >= bond_amount,
            EscrowError::IncorrectBondAmount
        );

        let escrow_id = ctx.accounts.escrow.escrow_id;
        let trade_id = ctx.accounts.escrow.trade_id;
        let escrow_key = ctx.accounts.escrow.key();

        let escrow = &mut ctx.accounts.escrow;

        // Store evidence hash in appropriate field
        if caller == escrow_buyer {
            // Verify no duplicate submission
            require!(escrow.dispute_evidence_hash_buyer.is_none(), EscrowError::DuplicateEvidence);
            escrow.dispute_evidence_hash_buyer = Some(evidence_hash);
        } else {
            // Verify no duplicate submission
            require!(escrow.dispute_evidence_hash_seller.is_none(), EscrowError::DuplicateEvidence);
            escrow.dispute_evidence_hash_seller = Some(evidence_hash);
        }

        // Transfer bond to dispute bond account
        let bond_account = if caller == escrow_buyer {
            &ctx.accounts.buyer_bond_account
        } else {
            &ctx.accounts.seller_bond_account
        };

        let transfer_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.responding_party_token_account.to_account_info(),
                to: bond_account.to_account_info(),
                authority: ctx.accounts.responding_party.to_account_info(),
            },
        );

        token::transfer(transfer_context, bond_amount)?;

        // Set arbitration deadline (not used in code but good practice)
        let _arbitration_deadline = current_time
            .checked_add(ARBITRATION_DEADLINE_HOURS * SECONDS_PER_HOUR)
            .ok_or(EscrowError::FeeCalculationError)?;

        emit!(DisputeResponseSubmitted {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            responding_party: caller,
            timestamp: current_time,
            evidence_hash,
            bond_amount,
        });

        Ok(())
    }

    pub fn default_judgment(ctx: Context<DefaultJudgment>) -> Result<()> {

        use constants::MAX_U64;

        // pull up vars
        let current_time = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        let escrow_key = escrow.key();
        let escrow_id = escrow.escrow_id;
        let trade_id = escrow.trade_id;
        let amount = escrow.amount;
        let fee = escrow.fee;
        let escrow_buyer = escrow.buyer;
        let escrow_seller = escrow.seller;
        let dispute_initiator_opt = escrow.dispute_initiator;
        let dispute_initiated_time = escrow.dispute_initiated_time;

        // Verify escrow state
        require!(escrow.state == EscrowState::Disputed, EscrowError::InvalidState);

        // Verify caller is the arbitrator
        require!(
            ctx.accounts.arbitrator.key() == escrow.arbitrator,
            EscrowError::Unauthorized
        );

        // Verify dispute initiator exists
        require!(dispute_initiator_opt.is_some(), EscrowError::InvalidState);
        let dispute_initiator = dispute_initiator_opt.unwrap();

        // Verify response deadline has passed
        let dispute_initiated_time = dispute_initiated_time.unwrap();
        let response_deadline = dispute_initiated_time
            .checked_add(DISPUTE_RESPONSE_DEADLINE_HOURS * SECONDS_PER_HOUR)
            .ok_or(EscrowError::FeeCalculationError)?;

        require!(current_time > response_deadline, EscrowError::InvalidState);

        // Determine winning party (the one who submitted evidence/bond)
        let evidence_hash_buyer = escrow.dispute_evidence_hash_buyer;
        let evidence_hash_seller = escrow.dispute_evidence_hash_seller;

        // Determine winner
        let winner = if dispute_initiator == escrow_buyer {
            // Buyer initiated dispute, check if seller responded
            if evidence_hash_seller.is_none() {
                escrow_buyer // Seller didn't respond, buyer wins
            } else {
                return Err(EscrowError::InvalidState.into()); // Both parties responded, cannot use default judgment
            }
        } else {
            // Seller initiated dispute, check if buyer responded
            if evidence_hash_buyer.is_none() {
                escrow_seller // Buyer didn't respond, seller wins
            } else {
                return Err(EscrowError::InvalidState.into()); // Both parties responded, cannot use default judgment
            }
        };

        // Calculate bond amount and total amount
        let total_amount = amount
            .checked_add(fee)
            .ok_or(EscrowError::FeeCalculationError)?
            .min(MAX_U64);

        let bond_amount = amount
            .checked_mul(DISPUTE_BOND_BASIS_POINTS)
            .ok_or(EscrowError::FeeCalculationError)?
            .checked_div(10000)
            .ok_or(EscrowError::FeeCalculationError)?
            .min(MAX_U64);

        // Determine winning account
        let winning_token_account = if winner == escrow_buyer {
            &ctx.accounts.buyer_token_account
        } else {
            &ctx.accounts.seller_token_account
        };

        // Get escrow token bump for seeds
        let escrow_token_bump = ctx.bumps.escrow_token_account;
        let escrow_token_seeds = &[
            b"escrow_token".as_ref(),
            escrow_key.as_ref(),
            &[escrow_token_bump]
        ];

        let signer_seeds = &[&escrow_token_seeds[..]];

        // Transfer all funds to winner
        let transfer_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: winning_token_account.to_account_info(),
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(transfer_context, total_amount)?;

        // set tracked balance to zero
        escrow.tracked_balance = 0;

        // emit escrow balance change event
        emit!(EscrowBalanceChanged {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            new_balance: 0,
            reason: "Dispute resolved by default judgment".to_string(),
            timestamp: current_time,
        });

        // Create arrays with longer lifetimes before the conditional block
        let buyer_bond_bump = ctx.bumps.buyer_bond_account;
        let buyer_bond_bump_array = [buyer_bond_bump];
        let buyer_bond_seeds_array = [
            b"buyer_bond".as_ref(),
            escrow_key.as_ref(),
            &buyer_bond_bump_array[..]
        ];

        let seller_bond_bump = ctx.bumps.seller_bond_account;
        let seller_bond_bump_array = [seller_bond_bump];
        let seller_bond_seeds_array = [
            b"seller_bond".as_ref(),
            escrow_key.as_ref(),
            &seller_bond_bump_array[..]
        ];

        // Return bond to winning party
        let (winning_bond_account, winning_bond_seeds) = if winner == escrow_buyer {
            (&ctx.accounts.buyer_bond_account, &buyer_bond_seeds_array[..])
        } else {
            (&ctx.accounts.seller_bond_account, &seller_bond_seeds_array[..])
        };

        // Create a slice of references to the conditionally assigned seeds
        let signer_seeds = &[&winning_bond_seeds[..]];

        let bond_transfer_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: winning_bond_account.to_account_info(),
                to: winning_token_account.to_account_info(),
                authority: winning_bond_account.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(bond_transfer_context, bond_amount)?;

        // Close escrow_token_account
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_token_account.to_account_info(),
                destination: ctx.accounts.seller.to_account_info(), // Refund to seller
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            &[&escrow_token_seeds[..]],
        ))?;

        // Close winning bond account
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: winning_bond_account.to_account_info(),
                destination: ctx.accounts.seller.to_account_info(), // Refund to seller
                authority: winning_bond_account.to_account_info(),
            },
            &[&winning_bond_seeds[..]],
        ))?;

        // Update escrow state
        escrow.state = EscrowState::Resolved;

        // Determine defaulting party
        let defaulting_party = if winner == escrow_buyer {
            escrow_seller
        } else {
            escrow_buyer
        };

        emit!(DisputeDefaultJudgment {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            defaulting_party,
            decision: winner == escrow_buyer, // true = funds to buyer
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn resolve_dispute_with_explanation(
        ctx: Context<ResolveDispute>,
        decision: bool, // true = release to buyer, false = return to seller
        resolution_hash: [u8; 32],
    ) -> Result<()> {
        use constants::MAX_U64;

        // pull up common vars
        let current_time = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        let escrow_key = escrow.key();
        let escrow_id = escrow.escrow_id;
        let trade_id = escrow.trade_id;
        let amount = escrow.amount;
        let fee = escrow.fee;
        let escrow_buyer = escrow.buyer;
        let escrow_seller = escrow.seller;
        let is_sequential = escrow.sequential;
        let sequential_escrow_address = escrow.sequential_escrow_address;
        let evidence_hash_buyer = escrow.dispute_evidence_hash_buyer;
        let evidence_hash_seller = escrow.dispute_evidence_hash_seller;

        // Verify escrow state
        require!(escrow.state == EscrowState::Disputed, EscrowError::InvalidState);

        // Verify caller is the arbitrator
        require!(
            ctx.accounts.arbitrator.key() == escrow.arbitrator,
            EscrowError::Unauthorized
        );

        // Verify both evidence hashes are present
        require!(
            evidence_hash_buyer.is_some() && evidence_hash_seller.is_some(),
            EscrowError::InvalidEvidenceHash
        );

        // Store resolution hash
        escrow.dispute_resolution_hash = Some(resolution_hash);

        // Calculate bond amount (5% of transaction value)
        let bond_amount = amount
            .checked_mul(DISPUTE_BOND_BASIS_POINTS)
            .ok_or(EscrowError::FeeCalculationError)?
            .checked_div(10000)
            .ok_or(EscrowError::FeeCalculationError)?
            .min(MAX_U64);

        // Verify both bonds are present by checking account balances
        require!(
            ctx.accounts.buyer_bond_account.amount >= bond_amount &&
            ctx.accounts.seller_bond_account.amount >= bond_amount,
            EscrowError::MissingDisputeBond
        );

        // Determine winning and losing parties based on decision
        let (winning_party, winning_token_account, winning_bond_account, losing_bond_account) =
            if decision {
                // Buyer wins
                (
                    escrow_buyer,
                    &ctx.accounts.buyer_token_account,
                    &ctx.accounts.buyer_bond_account,
                    &ctx.accounts.seller_bond_account,
                )
            } else {
                // Seller wins
                (
                    escrow_seller,
                    &ctx.accounts.seller_token_account,
                    &ctx.accounts.seller_bond_account,
                    &ctx.accounts.buyer_bond_account,
                )
            };

        // Get and prepare seeds
        let escrow_token_bump = ctx.bumps.escrow_token_account;
        let escrow_token_seeds = &[
            b"escrow_token".as_ref(),
            escrow_key.as_ref(),
            &[escrow_token_bump]
        ];

        if decision {
            // Split funds: principal and fee
            // Transfer fee to arbitrator

            let signer_seeds = &[&escrow_token_seeds[..]];

            let fee_transfer_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.arbitrator_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                signer_seeds,
            );

            token::transfer(fee_transfer_context, fee)?;

            // Transfer principal to buyer
            let principal_transfer_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                signer_seeds,
            );

            token::transfer(principal_transfer_context, amount)?;

            // set tracked balance to zero
            escrow.tracked_balance = 0;

            // emit escrow balance change event
            emit!(EscrowBalanceChanged {
                object_id: escrow_key,
                escrow_id,
                trade_id,
                new_balance: 0,
                reason: "Dispute resolved to buyer".to_string(),
                timestamp: current_time,
            });

        } else {
            // Transfer all funds to seller
            let total_amount = amount
                .checked_add(fee)
                .ok_or(EscrowError::FeeCalculationError)?
                .min(MAX_U64);

            let signer_seeds = &[&escrow_token_seeds[..]];

            let transfer_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.seller_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_token_account.to_account_info(),
                },
                signer_seeds,
            );

            token::transfer(transfer_context, total_amount)?;

            // set tracked balance to zero
            escrow.tracked_balance = 0;

            // emit escrow balance change event
            emit!(EscrowBalanceChanged {
                object_id: escrow_key,
                escrow_id,
                trade_id,
                new_balance: 0,
                reason: "Dispute resolved to seller".to_string(),
                timestamp: current_time,
            });
        }

        // Create all arrays with longer lifetimes before the conditional block
        let buyer_bond_bump = ctx.bumps.buyer_bond_account;
        let buyer_bond_bump_array = [buyer_bond_bump];
        let buyer_bond_seeds_array = [
            b"buyer_bond".as_ref(),
            escrow_key.as_ref(),
            &buyer_bond_bump_array[..]
        ];

        let seller_bond_bump = ctx.bumps.seller_bond_account;
        let seller_bond_bump_array = [seller_bond_bump];
        let seller_bond_seeds_array = [
            b"seller_bond".as_ref(),
            escrow_key.as_ref(),
            &seller_bond_bump_array[..]
        ];

        // Prepare bond seeds
        let (winning_bond_seeds, losing_bond_seeds) = if decision {
            // Buyer wins
            (&buyer_bond_seeds_array[..], &seller_bond_seeds_array[..])
        } else {
            // Seller wins
            (&seller_bond_seeds_array[..], &buyer_bond_seeds_array[..])
        };

        // Create slices of references to the conditionally assigned seeds
        // let winning_signer_seeds = &[&winning_bond_seeds[..]];
        // let losing_signer_seeds = &[&losing_bond_seeds[..]];
        let winning_signer_seeds = &[winning_bond_seeds];
        let losing_signer_seeds = &[losing_bond_seeds];

        // Return winner's bond
        let bond_return_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: winning_bond_account.to_account_info(),
                to: winning_token_account.to_account_info(),
                authority: winning_bond_account.to_account_info(),
            },
            winning_signer_seeds,
        );

        token::transfer(bond_return_context, bond_amount)?;

        // Transfer loser's bond to platform fee address (arbitrator for now)
        let loser_bond_transfer_context = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: losing_bond_account.to_account_info(),
                to: ctx.accounts.arbitrator_token_account.to_account_info(),
                authority: losing_bond_account.to_account_info(),
            },
            losing_signer_seeds,
        );

        token::transfer(loser_bond_transfer_context, bond_amount)?;

        // Close escrow_token_account
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_token_account.to_account_info(),
                destination: ctx.accounts.seller.to_account_info(),
                authority: ctx.accounts.escrow_token_account.to_account_info(),
            },
            &[&escrow_token_seeds[..]],
        ))?;

        // Close winning bond account
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: winning_bond_account.to_account_info(),
                destination: ctx.accounts.seller.to_account_info(),
                authority: winning_bond_account.to_account_info(),
            },
            winning_signer_seeds,
        ))?;

        // Close losing bond account
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: losing_bond_account.to_account_info(),
                destination: ctx.accounts.seller.to_account_info(),
                authority: losing_bond_account.to_account_info(),
            },
            losing_signer_seeds,
        ))?;

        // Update escrow state
        escrow.state = EscrowState::Resolved;
        escrow.counter = escrow.counter.checked_add(1).unwrap();
        let counter = escrow.counter;

        // Destination for funds (used only in event)
        let _funds_destination = if decision && is_sequential && sequential_escrow_address.is_some() {
            sequential_escrow_address.unwrap()
        } else if decision {
            escrow_buyer
        } else {
            escrow_seller
        };

        emit!(DisputeResolved {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            decision,
            fee,
            counter,
            timestamp: current_time,
            resolution_hash,
            winner: winning_party,
            explanation_reference: "".to_string(), // Reference to off-chain explanation
        });

        Ok(())
    }

    pub fn auto_cancel(ctx: Context<AutoCancel>) -> Result<()> {
        use constants::MAX_U64;

        // pull up vars
        let current_time = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        let escrow_key = escrow.key();
        let escrow_id = escrow.escrow_id;
        let trade_id = escrow.trade_id;
        let amount = escrow.amount;
        let fee = escrow.fee;
        let seller = escrow.seller;
        let current_state = escrow.state;
        let deposit_deadline = escrow.deposit_deadline;
        let fiat_deadline = escrow.fiat_deadline;
        let fiat_paid = escrow.fiat_paid;


        // Verify caller is the arbitrator
        require!(
            ctx.accounts.arbitrator.key() == escrow.arbitrator,
            EscrowError::Unauthorized
        );

        // Verify escrow is not in a terminal state
        require!(
            current_state != EscrowState::Released &&
            current_state != EscrowState::Cancelled &&
            current_state != EscrowState::Resolved,
            EscrowError::TerminalState
        );

        // Check for deposit deadline expiry in Created state
        if current_state == EscrowState::Created {
            require!(current_time > deposit_deadline, EscrowError::InvalidState);
        }

        // Check for fiat deadline expiry in Funded state
        if current_state == EscrowState::Funded {
            require!(
                current_time > fiat_deadline && !fiat_paid,
                EscrowError::InvalidState
            );
        }

        // If funds are present, return them to seller
        if current_state == EscrowState::Funded {
            // Ensure escrow token account and seller token account are present
            let escrow_token_account = ctx.accounts.escrow_token_account.as_ref()
                .ok_or(EscrowError::InvalidState)?;

            let seller_token_account = ctx.accounts.seller_token_account.as_ref()
                .ok_or(EscrowError::InvalidState)?;

            let total_amount = amount
                .checked_add(fee)
                .ok_or(EscrowError::FeeCalculationError)?
                .min(MAX_U64);

            let escrow_token_bump = ctx.bumps.escrow_token_account;
            let seeds = &[
                b"escrow_token".as_ref(),
                escrow_key.as_ref(),
                // need expect due to Option(al) nature of bump
                &[escrow_token_bump.expect("Bump not found for escrow_token_account")]
            ];

            let signer_seeds = &[&seeds[..]];

            let transfer_context = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: escrow_token_account.to_account_info(),
                    to: seller_token_account.to_account_info(),
                    authority: escrow_token_account.to_account_info(),
                },
                signer_seeds,
            );

            token::transfer(transfer_context, total_amount)?;

            // set tracked balance to zero
            escrow.tracked_balance = 0;

            // emit escrow balance change event
            emit!(EscrowBalanceChanged {
                object_id: escrow_key,
                escrow_id,
                trade_id,
                new_balance: 0,
                reason: "Escrow auto-cancelled".to_string(),
                timestamp: current_time,
            });

            token::close_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: escrow_token_account.to_account_info(),
                    destination: ctx.accounts.seller.to_account_info(), // Refund to seller (matches close = seller)
                    authority: escrow_token_account.to_account_info(),
                },
                signer_seeds,
            ))?;
        }

        // Update escrow state
        escrow.state = EscrowState::Cancelled;
        escrow.counter = escrow.counter.checked_add(1).unwrap();
        let counter = escrow.counter;

        emit!(EscrowCancelled {
            object_id: escrow_key,
            escrow_id,
            trade_id,
            seller,
            amount,
            fee,
            counter,
            timestamp: current_time,
        });

        Ok(())
    }
}

#[derive(Accounts)] // Applied to structs to indicate a list of accounts required by an instruction
#[instruction(escrow_id: u64, trade_id: u64, amount: u64, sequential: bool, sequential_escrow_address: Option<Pubkey>)]
// REQUIRED: seller, buyer, escrow (account), system_program
// this is the escrow _state_ account ("rulebook")
pub struct CreateEscrow<'info> {
    // pass in mutable account
    #[account(mut)]
    pub seller: Signer<'info>,

    /// CHECK: Buyer account is just used for escrow parameters
    pub buyer: AccountInfo<'info>,

    #[account(
        // init used to create the account
        init,
        payer = seller,
        // account discriminator
        space = 8 + std::mem::size_of::<Escrow>(),
        // space = 337,
        seeds = [b"escrow", escrow_id.to_le_bytes().as_ref(), trade_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_escrow_id: u64, _trade_id: u64)]
// this is the escrow _token_ account ("vault")
pub struct FundEscrow<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", _escrow_id.to_le_bytes().as_ref(), _trade_id.to_le_bytes().as_ref()],
        // automatic bump calculation
        bump,
        constraint = escrow.seller == seller.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == token_mint.key()
    )]
    pub seller_token_account: Account<'info, token::TokenAccount>,

    #[account(
        init,
        payer = seller,
        seeds = [b"escrow_token", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = escrow_token_account,
    )]
    pub escrow_token_account: Account<'info, token::TokenAccount>,

    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MarkFiatPaid<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        constraint = escrow.buyer == buyer.key()
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct UpdateSequentialAddress<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        constraint = escrow.buyer == buyer.key()
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        close = authority,
        constraint = escrow.seller == authority.key() || escrow.arbitrator == authority.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"escrow_token", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = buyer_token_account.owner == escrow.buyer,
        constraint = buyer_token_account.mint == escrow_token_account.mint
    )]
    pub buyer_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = arbitrator_token_account.owner == escrow.arbitrator,
        constraint = arbitrator_token_account.mint == escrow_token_account.mint
    )]
    pub arbitrator_token_account: Account<'info, token::TokenAccount>,

    #[account(mut)]
    pub sequential_escrow_token_account: Option<Account<'info, token::TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    /// CHECK: Seller is the refund destination, verified by the close constraint
    #[account(mut)]
    pub seller: AccountInfo<'info>, // Refund destination
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        close = seller,
        constraint = escrow.seller == authority.key() || escrow.arbitrator == authority.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"escrow_token", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Option<Account<'info, token::TokenAccount>>,

    #[account(mut)]
    pub seller_token_account: Option<Account<'info, token::TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

// new, part of refactor to solve stack overflow
// Split into two separate context structs
#[derive(Accounts)]
#[instruction(escrow_id: u64, trade_id: u64)]
pub struct InitializeBuyerBondAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"escrow", escrow_id.to_le_bytes().as_ref(), trade_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        init,
        payer = payer,
        seeds = [b"buyer_bond", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = buyer_bond_account,
    )]
    pub buyer_bond_account: Account<'info, token::TokenAccount>,

    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(escrow_id: u64, trade_id: u64)]
pub struct InitializeSellerBondAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"escrow", escrow_id.to_le_bytes().as_ref(), trade_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        init,
        payer = payer,
        seeds = [b"seller_bond", escrow.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = seller_bond_account,
    )]
    pub seller_bond_account: Account<'info, token::TokenAccount>,

    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// refactored for stack overflow error
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    #[account(mut)]
    pub disputing_party: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        constraint = escrow.buyer == disputing_party.key() || escrow.seller == disputing_party.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        constraint = disputing_party_token_account.owner == disputing_party.key()
    )]
    pub disputing_party_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"buyer_bond", escrow.key().as_ref()],
        bump
    )]
    pub buyer_bond_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"seller_bond", escrow.key().as_ref()],
        bump
    )]
    pub seller_bond_account: Account<'info, token::TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RespondToDispute<'info> {
    #[account(mut)]
    pub responding_party: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        constraint = responding_party_token_account.owner == responding_party.key()
    )]
    pub responding_party_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"buyer_bond", escrow.key().as_ref()],
        bump
    )]
    pub buyer_bond_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"seller_bond", escrow.key().as_ref()],
        bump
    )]
    pub seller_bond_account: Account<'info, token::TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DefaultJudgment<'info> {
    /// CHECK: Seller is the refund destination, verified by the close constraint
    #[account(mut)]
    pub seller: AccountInfo<'info>, // Refund destination
    #[account(mut)]
    pub arbitrator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        // rent goes to seller
        close = seller,
        // but only arbitrator can call this
        constraint = escrow.arbitrator == arbitrator.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"escrow_token", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = buyer_token_account.owner == escrow.buyer
    )]
    pub buyer_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = seller_token_account.owner == escrow.seller
    )]
    pub seller_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"buyer_bond", escrow.key().as_ref()],
        bump
    )]
    pub buyer_bond_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"seller_bond", escrow.key().as_ref()],
        bump
    )]
    pub seller_bond_account: Account<'info, token::TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub arbitrator: Signer<'info>,
    // For rent refund
    /// CHECK: Seller is the refund destination, verified by the close constraint
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        close = seller,
        constraint = escrow.arbitrator == arbitrator.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"escrow_token", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = buyer_token_account.owner == escrow.buyer
    )]
    pub buyer_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = seller_token_account.owner == escrow.seller
    )]
    pub seller_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        constraint = arbitrator_token_account.owner == escrow.arbitrator
    )]
    pub arbitrator_token_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"buyer_bond", escrow.key().as_ref()],
        bump
    )]
    pub buyer_bond_account: Account<'info, token::TokenAccount>,

    #[account(
        mut,
        seeds = [b"seller_bond", escrow.key().as_ref()],
        bump
    )]
    pub seller_bond_account: Account<'info, token::TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AutoCancel<'info> {
    #[account(mut)]
    pub arbitrator: Signer<'info>,
    // For rent refund
    /// CHECK: Seller is the refund destination, verified by the close constraint
    #[account(mut)]
    pub seller: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow.escrow_id.to_le_bytes().as_ref(), escrow.trade_id.to_le_bytes().as_ref()],
        bump,
        close = seller,
        constraint = escrow.arbitrator == arbitrator.key()
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(
        mut,
        seeds = [b"escrow_token", escrow.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Option<Account<'info, token::TokenAccount>>,

    #[account(mut)]
    pub seller_token_account: Option<Account<'info, token::TokenAccount>>,

    pub token_program: Program<'info, Token>,
}

// Applied to structs to create custom account types for the program
#[account]
// #[derive(Debug)]
pub struct Escrow {
    pub escrow_id: u64,
    pub trade_id: u64,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub arbitrator: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub deposit_deadline: i64,
    pub fiat_deadline: i64,
    pub state: EscrowState,
    pub sequential: bool,
    pub sequential_escrow_address: Option<Pubkey>,
    pub fiat_paid: bool,
    pub counter: u64,
    // Dispute resolution fields
    pub dispute_initiator: Option<Pubkey>,
    pub dispute_initiated_time: Option<i64>,
    pub dispute_evidence_hash_buyer: Option<[u8; 32]>,
    pub dispute_evidence_hash_seller: Option<[u8; 32]>,
    pub dispute_resolution_hash: Option<[u8; 32]>,
    // tracked balance field for off-chain indexers
    pub tracked_balance: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum EscrowState {
    Created,
    Funded,
    Released,
    Cancelled,
    Disputed,
    Resolved
}

// Events
#[event]
pub struct EscrowCreated {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub seller: Pubkey,
    pub buyer: Pubkey,
    pub arbitrator: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub deposit_deadline: i64,
    pub fiat_deadline: i64,
    pub sequential: bool,
    pub sequential_escrow_address: Option<Pubkey>,
    pub timestamp: i64,
}

#[event]
pub struct FundsDeposited {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub amount: u64,
    pub fee: u64,
    pub counter: u64,
    pub timestamp: i64,
}

#[event]
pub struct FiatMarkedPaid {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub timestamp: i64,
}

#[event]
pub struct EscrowReleased {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub buyer: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub counter: u64,
    pub timestamp: i64,
    pub destination: Pubkey,
}

#[event]
pub struct EscrowCancelled {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub seller: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub counter: u64,
    pub timestamp: i64,
}

#[event]
pub struct DisputeOpened {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub disputing_party: Pubkey,
    pub timestamp: i64,
    pub evidence_hash: [u8; 32],
    pub bond_amount: u64,
}

#[event]
pub struct DisputeResponseSubmitted {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub responding_party: Pubkey,
    pub timestamp: i64,
    pub evidence_hash: [u8; 32],
    pub bond_amount: u64,
}

#[event]
pub struct DisputeResolved {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub decision: bool,
    pub fee: u64,
    pub counter: u64,
    pub timestamp: i64,
    pub resolution_hash: [u8; 32],
    pub winner: Pubkey,
    pub explanation_reference: String,
}

#[event]
pub struct DisputeDefaultJudgment {
    pub object_id: Pubkey,
    pub escrow_id: u64,
    pub trade_id: u64,
    pub defaulting_party: Pubkey,
    pub decision: bool,
    pub timestamp: i64,
}

#[event]
pub struct EscrowBalanceChanged {
    pub object_id: Pubkey,     // the escrow account address (PDA) itself
    pub escrow_id: u64,
    pub trade_id: u64,         // makes it easier to link across systems
    pub new_balance: u64,
    pub reason: String,        // e.g. "Escrow funded" / "Escrow released"
    pub timestamp: i64,        // when it happened (for audit trails)
}

#[event]
pub struct SequentialAddressUpdated {
    pub object_id: Pubkey,       // the escrow account PDA
    pub escrow_id: u64,
    pub trade_id: u64,
    pub old_address: Option<Pubkey>,
    pub new_address: Pubkey,
    pub timestamp: i64,
}
