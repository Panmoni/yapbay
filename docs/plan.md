# YapBay Frontend Development Plan

4.1

## UI
grep for gray, purple, -[#
create new offer button
still purple and green in the edit offer buttons

## API integration
- account creation, editing
- data fetching offers, details, escrows
- call API endpoints for creating, updating, and deleting data (Offers, Trades, Account).

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