# YapBay Frontend Development Plan

finish trade 23

test update of escrow, trade tables for events

## fix

test correct recording of transaction types... still not working

## escrow

- release escrow
- cancel escrow

## Roadmap

- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?
- useUserAccount for Account Page?
- make sure RPC is efficient, maybe cache some of them.. run it through a redis?

### Refund when Mark Fiat Paid timer runs out but escrow is still funded.. refund and then cancel both trade in db, escrow in db and on-chain escrow

Based on my analysis of the codebase, I'll create a detailed plan for implementing an automatic refund mechanism when the "mark fiat paid" deadline expires. This plan takes into account the existing architecture and the memory about the escrow balance bug fix.

Detailed Plan: Automatic USDC Refund for Expired "Mark Fiat Paid" Deadline
Current Understanding
The escrow system has multiple states: CREATED, FUNDED, FIAT_PAID, RELEASED, CANCELLED, DISPUTED, RESOLVED
When an escrow is in FUNDED state, the buyer has a deadline to mark fiat as paid
The TradeTimer component already has an onExpire callback that can be used to trigger actions
The system has existing functionality to cancel trades, but it's currently only triggered manually
Proposed Solution

1. Create a New Automatic Refund Service
   I propose creating a dedicated service to handle automatic refunds with the following components:

A. Backend Service for Deadline Monitoring
Create a new service that periodically checks for escrows with expired fiat payment deadlines
This ensures refunds happen even if the user is not actively viewing the trade page
B. Smart Contract Function for Automatic Refunds
Add a new function to the escrow smart contract that allows refunding USDC to the seller when the fiat payment deadline has expired
This function should verify the deadline has passed and the escrow is still in FUNDED state
C. Frontend Integration with TradeTimer
Utilize the existing onExpire callback in the TradeTimer component to trigger the refund process when the user is viewing the trade page 2. Implementation Details
A. Smart Contract Modifications
Add a new function refundExpiredEscrow that:
Verifies the escrow is in FUNDED state
Checks if the fiat_deadline has passed
Refunds the USDC to the seller
Updates the escrow state to CANCELLED
Emits an event for tracking
B. Backend Service
Create a scheduled job that runs every X minutes (configurable)
Query all escrows in FUNDED state where fiat_deadline has passed
For each expired escrow, call the refundExpiredEscrow function
Log all refund attempts and results
Notify affected users via email/notifications
C. Frontend Integration
Modify the TradeStatusDisplay component to:
Pass an appropriate onExpire callback to the TradeTimer for the "mark fiat paid" deadline
Show a warning as the deadline approaches
Display a clear message when a refund has been processed
Add a new chainService function refundExpiredEscrowTransaction that:
Calls the smart contract's refund function
Handles transaction monitoring and error reporting
Add a new tradeService function refundExpiredEscrow that:
Calls the chainService function
Updates the backend API about the refund
Shows appropriate notifications to the user 3. User Experience Considerations
Clear countdown display with color changes as deadline approaches
Warning notifications at set intervals (e.g., 24 hours, 6 hours, 1 hour before expiry)
Immediate notification when a refund is processed
Transaction history showing refund details 4. Testing Strategy
Unit tests for new contract functions
Integration tests for the refund service
End-to-end tests simulating deadline expiration
Manual testing with different timing scenarios 5. Monitoring and Maintenance
Add logging for all refund attempts and results
Create alerts for failed refunds
Dashboard to monitor pending deadlines and recent refunds
Regular audit of refund transactions
Implementation Phases
Phase 1: Smart Contract & Backend
Develop and test the smart contract function
Implement the backend monitoring service
Deploy to testnet for initial testing
Phase 2: Frontend Integration
Implement the TradeTimer callback
Add the new chainService and tradeService functions
Update UI components to show refund status
Phase 3: Testing & Deployment
Comprehensive testing of the entire flow
Gradual rollout to production
Monitor for any issues
Benefits of This Approach
Reliability: Multiple mechanisms ensure refunds happen (backend service + frontend triggers)
Transparency: Clear notifications and status updates for users
Scalability: Service-based approach can handle many trades simultaneously
Security: Proper validation at both contract and service levels
Potential Challenges
Gas costs for automatic refunds (could be mitigated by batching)
Network congestion affecting timely refunds
Time zone considerations for deadline display
Would you like me to proceed with implementing this plan or would you like to discuss any specific aspects in more detail?

## Ref

https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C
