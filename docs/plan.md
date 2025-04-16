# YapBay Frontend Development Plan

## UI
      // Background Colors (using neutral for consistency, can be aliased if needed)
      'bg-primary': 'var(--primary-900)', // Alias for page background
      'bg-secondary': 'var(--neutral-200)', // Alias for card/section backgrounds
      'bg-tertiary': 'var(--neutral-300)', // Alias for highlighted backgrounds


      above font family

      It was also in index.css

      The problems are in index.css really.


      .btn .btn-primary


      look for gray and [#


## API integration
- account creation, editing
- data fetching offers, details, escrows
- call API endpoints for creating, updating, and deleting data (Offers, Trades, Account).


## colors
I don't think tailwind is properly initialized

## chain
- abi, types


*   **Escrow Lifecycle Functions:** Implement functions within `useYapBayEscrow` or dedicated service files to interact with the contract's methods:
    *   `createEscrow`: Called when a user accepts an offer or initiates a trade. Requires parameters like `tradeId`, `buyer`, `amount`, etc. Map API trade data to contract parameters.
    *   `fundEscrow`: Called by the seller. Requires USDC approval first, then calls the contract function.
    *   `markFiatPaid`: Called by the buyer.
    *   `releaseEscrow`: Called by the seller after fiat payment confirmation.
    *   `cancelEscrow`: Called under specific conditions (e.g., timeout).
    *   `autoCancel`: Implement logic to check deadlines and allow calling this.
    *   Dispute Handling (`openDisputeWithBond`, `respondToDisputeWithBond`, `resolveDisputeWithExplanation`, `defaultJudgment`): Implement UI and logic for the dispute process, including bond handling (requires USDC approval).
*   **Event Listening (Optional but Recommended):** Set up listeners for contract events (`EscrowCreated`, `FundsDeposited`, `FiatMarkedPaid`, `EscrowReleased`, `DisputeOpened`, etc.) to update the UI in real-time or trigger notifications.
*   **USDC Token Interaction:** Implement functions for approving USDC transfers to the escrow contract before funding or bonding. Use the standard ERC20 ABI.
*   **Error Handling:** Implement robust error handling for blockchain transactions (user rejection, gas issues, contract reverts).