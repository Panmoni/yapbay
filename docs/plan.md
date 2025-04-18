# YapBay Frontend Development Plan



## API integration
- log in as user 2, create account
- trade creation, details
- trade process

## test deployed contracts
see contracts repo

## chain: org this stuff
- escrow functions
    *   `createEscrow`: Called when a user accepts an offer or initiates a trade. Requires parameters like `tradeId`, `buyer`, `amount`, etc. Map API trade data to contract parameters.
    *   `fundEscrow`: Called by the seller. Requires USDC approval first, then calls the contract function.
    *   `markFiatPaid`: Called by the buyer.
    *   `releaseEscrow`: Called by the seller after fiat payment confirmation.
    *   `cancelEscrow`: Called under specific conditions (e.g., timeout).
    *   `autoCancel`: Implement logic to check deadlines and allow calling this.
    *   Dispute Handling (`openDisputeWithBond`, `respondToDisputeWithBond`, `resolveDisputeWithExplanation`, `defaultJudgment`): Implement UI and logic for the dispute process, including bond handling (requires USDC approval).
- event listener (`EscrowCreated`, `FundsDeposited`, `FiatMarkedPaid`, `EscrowReleased`, `DisputeOpened`, etc.) 
- **USDC Token Interaction:** Implement functions for approving USDC transfers to the escrow contract before funding or bonding. Use the standard ERC20 ABI.
- **Error Handling:** Implement robust error handling for blockchain transactions (user rejection, gas issues, contract reverts).