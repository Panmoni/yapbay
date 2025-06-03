# YapBay Frontend Development Plan

- telegram auto fill on profile

## Complete Divvi Integration
- https://docs.divvi.xyz/builder-camp
- perfect and fully integrate it
- handle and store returns from their api.
- consider privacy implications and discloscure https://valora.xyz/privacy
- take into account api routes for this, see Divvi Referrals API Documentation in api repo

### example code

// OLD: Direct SDK call
await submitReferral({ txHash, chainId });

// NEW: API call
const response = await fetch('/api/divvi-referrals', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ transactionHash: txHash, chainId, tradeId })
});

## Add Notifications System
- sync with email, tg

## update for multi-network
- new balance functions, auto cancel, timers as well. see doc in api
- move usdc balance out of dropdown to underneath or enxt to dynamic widget or make a my balances page?


### Test Dual Networks
- npm run dev and:
- does everything still work on testnet?
- does everything still work on mainnet?
- does switching network force wallet to switch too?
- does switch network truly put the dapp on the new network?

## Test New Contract Functions
- test recording of EscrowBalanceChanged events via listener/api/db
- test recording of all events as type event
- add ability to check escrow balance in db (product of events) to frontend and compare to calculated escrow balance using /escrows/{escrowId}/balance API route
- implement cancel escrow/trade


### auto cancel
C. Frontend Integration with TradeTimer
Utilize the existing onExpire callback in the TradeTimer component to trigger the refund process when the user is viewing the trade page 2. Implementation Details

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

Phase 2: Frontend Integration
Implement the TradeTimer callback
Add the new chainService and tradeService functions
Update UI components to show refund status

### 3. Frontend Improvements

1. **Enhanced Trade Timer Display**:
   - Show countdown with visual indicators (green → yellow → red)
   - Display explicit warnings when approaching deadline

2. **Self-Service Cancellation**:
   - Add a "Cancel & Refund" button that appears when the fiat deadline has passed
   - This would call the enhanced `autoCancel` function directly from the seller's wallet
   - Include clear messaging about when and why this option is available

3. **Status Tracking**:
   - Update trade status to "Fiat Payment Deadline Expired" when appropriate
   - Display refund status and transaction details after cancellation

## cleanup
- update frontend docs, review state ref escrows trades and trade checklist
- clear out extraneous comments from yapbay frontend
- improve the dev/prod env var management
- get the new pods to restart on boot

### Refactoring
- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?

### Reliability
- make sure RPC is efficient, maybe cache some of them.. run it through a redis?
- integrate thirdweb as backup or even primary RPC https://thirdweb.com/team/panmoni/YapBay-90f2e3
- test mobile layout