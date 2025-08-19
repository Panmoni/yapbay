# YapBay Frontend Development Plan

Review repo and re-familiarize

Review solana program and consider improvements

So I think I create a new branch on the frontend, clear out the Celo stuff, add in Solana stuff but in the form of an SDK so I can easily swap it out in the future.

- bring over solana wallet stuff
- keep ability to have Celo?

## Then review the API.

## Then deploy probably.

---

---

## misc notes

- telegram auto fill on profile
  gotta update divvi list for new program https://x.com/jackie_bona/status/1930312822069833957

## Add payment methods

add pagomovil https://t.me/yuneHR16 perfect payment methods and expose it for direct user management

## Add self-rolled chat

## Improve pricing

https://rapidapi.com/zigzagway/api/binance-p2p-api/playground/apiendpoint_8ede70d4-d835-49c6-858d-0375fd842fbf

need sources for NGN, VES etc that are reliable

## replace redis with https://valkey.io/

## add more notifs: whatsapp, sms, mobile push notifs

## social

strategic friction [https://read.first1000.co/p/positive-friction](https://read.first1000.co/p/positive-friction). User can check in and have a log on the site of which users are checking in. Take inspiration from pump.fun maybe the social feature leverages the chat

## leg2 plan Fiat-to-fiat wizard for efficient currency conversion Get Leg2 Working for Full Remittance Flow

## script an easy redeploy of everything in case server dies. Just match postgres backup with github code to re-deploy from scratch

## implement backend monitoring service to ensure funds are not getting stranded in escrows

Optimal Plan: Combining Existing Functionality with New Automation

Here's my recommended approach that builds on your ideas while leveraging the existing contract functionality:

### 1. Smart Contract Enhancements

Rather than creating a new function, I recommend enhancing the existing `autoCancel` function:

```solidity
function autoCancel(uint256 _escrowId) external nonReentrant whenNotPaused {
    Escrow storage escrow = escrows[_escrowId];

    // Allow the seller to call this function in addition to the arbitrator
    require(
        msg.sender == fixedArbitrator || msg.sender == escrow.seller,
        ""E102: Unauthorized caller""
    );

    require(
        escrow.state != EscrowState.Released &&
            escrow.state != EscrowState.Cancelled &&
            escrow.state != EscrowState.Resolved,
        ""E107: Escrow in terminal state""
    );

    if (escrow.state == EscrowState.Created) {
        require(
            block.timestamp > escrow.deposit_deadline,
            ""Deposit deadline not expired""
        );
    }
    if (escrow.state == EscrowState.Funded) {
        require(!escrow.fiat_paid, ""Fiat already paid; cannot auto-cancel"");
        require(
            block.timestamp > escrow.fiat_deadline,
            ""Fiat deadline not expired""
        );
        usdc.safeTransfer(escrow.seller, escrow.amount);
        escrowBalances[_escrowId] = 0;
        emit EscrowBalanceChanged(
            _escrowId,
            0,
            ""Escrow auto-cancelled due to expired fiat deadline""
        );
    }
    escrow.state = EscrowState.Cancelled;
    escrow.counter++;
    emit EscrowCancelled(
        _escrowId,
        escrow.trade_id,
        escrow.seller,
        escrow.amount,
        escrow.counter,
        block.timestamp
    );
}

// Add a new view function to check if an escrow is eligible for auto-cancellation
function isEligibleForAutoCancel(uint256 _escrowId) external view returns (bool) {
    Escrow storage escrow = escrows[_escrowId];

    // Check if escrow is in a non-terminal state
    if (escrow.state == EscrowState.Released ||
        escrow.state == EscrowState.Cancelled ||
        escrow.state == EscrowState.Resolved) {
        return false;
    }

    // Check deadline conditions
    if (escrow.state == EscrowState.Created) {
        return block.timestamp > escrow.deposit_deadline;
    }
    if (escrow.state == EscrowState.Funded) {
        return !escrow.fiat_paid && block.timestamp > escrow.fiat_deadline;
    }

    return false;
}
```

Key enhancements:

- Allow the seller to directly trigger auto-cancellation
- Add a view function to easily check if an escrow is eligible for cancellation

### 2. Backend Monitoring Service

Create a service that:

1. **Periodically Scans for Expired Escrows**:
      - Query all escrows in `Funded` state
      - Use the `isEligibleForAutoCancel` function to filter eligible escrows
      - This can be done without gas costs since it's a view function

2. **Automated Cancellation Process**:
      - Have a configurable threshold (e.g., cancel escrows expired for >1 hour)
      - Call `autoCancel` for each eligible escrow, using the arbitrator wallet
      - Implement batching to reduce gas costs
      - Log all attempts and results

3. **Notification System**:
      - Notify sellers about pending/completed auto-cancellations
      - Provide cancellation receipts with transaction details

### 3. Frontend Improvements

1. **Enhanced Trade Timer Display**:
      - Show countdown with visual indicators (green → yellow → red)
      - Display explicit warnings when approaching deadline

2. **Self-Service Cancellation**:
      - Add a ""Cancel & Refund"" button that appears when the fiat deadline has passed
      - This would call the enhanced `autoCancel` function directly from the seller's wallet
      - Include clear messaging about when and why this option is available

3. **Status Tracking**:
      - Update trade status to ""Fiat Payment Deadline Expired"" when appropriate
      - Display refund status and transaction details after cancellation

### 4. Implementation Phases

**Phase 1: Smart Contract Updates**

- Enhance the `autoCancel` function to allow seller triggering
- Add the `isEligibleForAutoCancel` view function
- Comprehensive testing on testnet

**Phase 2: Frontend Self-Service**

- Implement the enhanced trade timer
- Add the ""Cancel & Refund"" button for sellers
- Update status displays and notifications

**Phase 3: Backend Automation**

- Deploy the monitoring service
- Implement the batched cancellation process
- Set up logging and alerting

**Phase 4: Monitoring & Optimization**

- Track cancellation patterns
- Adjust thresholds and timing based on data
- Optimize gas usage for batch operations

## Conclusion and Recommendations

The existing YapBayEscrow contract provides a solid foundation for handling expired fiat payment deadlines, but lacks automation. Your proposed plan correctly identifies the need for proactive monitoring and user-friendly interfaces.

My optimal recommendation combines:

1. **Minor smart contract enhancements** to leverage existing functionality
2. **Self-service options** to empower sellers
3. **Backend automation** as a safety net
4. **Clear user interface elements** to improve transparency

This approach balances:

- **Efficiency**: Using existing functions with minor improvements
- **Gas optimization**: View functions for monitoring, batching for execution
- **User control**: Allowing sellers to recover funds directly
- **Redundancy**: Backend automation as a backup

The key insight is that we don't need to reinvent the contract logic, but rather create better automation and interfaces around the existing functionality. This approach minimizes smart contract changes (reducing risk) while maximizing the user experience improvements.

Would you like me to further detail any specific aspect of this plan, or make any smart contract code changes to implement the recommendations?

Backend Monitoring Service Design

Since you mentioned that what you really need is the backend monitoring service, let me provide a detailed design for that component. This would complement the newly added `isEligibleForAutoCancel` function perfectly.

### Backend Service for Auto-Cancellation

#### 1. Architecture

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│  Escrow        │     │  Monitoring    │     │  Arbitrator    │
│  Contract      │◄────┤  Service       │◄────┤  Wallet        │
│                │     │                │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
                              │
                              ▼
                       ┌────────────────┐
                       │                │
                       │  Notification  │
                       │  Service       │
                       │                │
                       └────────────────┘
```

#### 2. Components

**a. Escrow Monitor**

```typescript
class EscrowMonitor {
  private provider: ethers.providers.Provider;
  private escrowContract: YapBayEscrow;
  private db: Database;
  private notificationService: NotificationService;

  constructor(providerUrl: string, contractAddress: string, arbitratorPrivateKey: string) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    this.wallet = new ethers.Wallet(arbitratorPrivateKey, this.provider);
    this.escrowContract = YapBayEscrow__factory.connect(contractAddress, this.wallet);
    this.db = new Database();
    this.notificationService = new NotificationService();
  } // Main monitoring function, runs on a schedule

  async checkForExpiredEscrows() {
    // Get all active escrowIds from database
    const activeEscrows = await this.db.getActiveEscrows(); // Process in batches to avoid rate limits

    const batchSize = 50;
    for (let i = 0; i < activeEscrows.length; i += batchSize) {
      const batch = activeEscrows.slice(i, i + batchSize);
      await this.processBatch(batch);
    }
  }

  async processBatch(escrowIds: number[]) {
    const eligibilityChecks = await Promise.all(escrowIds.map(id => this.checkEligibility(id)));

    const eligibleEscrows = escrowIds.filter((_, index) => eligibilityChecks[index]);

    if (eligibleEscrows.length > 0) {
      // Log eligible escrows
      console.log(`Found ${eligibleEscrows.length} escrows eligible for auto-cancellation`); // For each eligible escrow, perform cancellation

      await this.performCancellations(eligibleEscrows);
    }
  }

  async checkEligibility(escrowId: number): Promise<boolean> {
    try {
      return await this.escrowContract.isEligibleForAutoCancel(escrowId);
    } catch (error) {
      console.error(`Error checking eligibility for escrow ${escrowId}:`, error);
      return false;
    }
  }

  async performCancellations(escrowIds: number[]) {
    // Group escrows for batched cancellation if gas optimization is needed
    // For now, process one by one to avoid issues with one tx failing

    for (const escrowId of escrowIds) {
      try {
        // Get escrow details for notification
        const escrow = await this.db.getEscrowDetails(escrowId); // Perform the cancellation

        console.log(`Cancelling escrow ${escrowId}...`);
        const tx = await this.escrowContract.autoCancel(escrowId);
        const receipt = await tx.wait(); // Update database

        await this.db.updateEscrowStatus(escrowId, 'CANCELLED', {
          txHash: receipt.transactionHash,
          timestamp: Date.now(),
        }); // Send notification

        await this.notificationService.notifyCancellation(
          escrow.seller,
          escrowId,
          receipt.transactionHash
        );

        console.log(`Successfully cancelled escrow ${escrowId}`);
      } catch (error) {
        console.error(`Failed to cancel escrow ${escrowId}:`, error); // Log failed cancellation for monitoring/alerting

        await this.db.logFailedCancellation(escrowId, error.toString());
      }
    }
  }
}
```

**b. Scheduler**

```typescript
import { CronJob } from 'cron';
import { EscrowMonitor } from './EscrowMonitor';

// Initialize monitor
const monitor = new EscrowMonitor(
  process.env.PROVIDER_URL,
  process.env.ESCROW_CONTRACT_ADDRESS,
  process.env.ARBITRATOR_PRIVATE_KEY
);

// Run every 10 minutes
const job = new CronJob('*/10 * * * *', async () => {
  console.log('Starting expired escrow check...');
  try {
    await monitor.checkForExpiredEscrows();
    console.log('Expired escrow check completed');
  } catch (error) {
    console.error('Error in expired escrow check:', error);
  }
});

// Start the job
job.start();
console.log('Auto-cancellation monitoring service started');
```

**c. Notification Service**

```typescript
class NotificationService {
  async notifyCancellation(sellerAddress: string, escrowId: number, txHash: string) {
    // Get seller's contact info from database
    const contact = await this.getUserContact(sellerAddress);

    if (contact.email) {
      await this.sendEmail(
        contact.email,
        'Escrow Auto-Cancelled',
        `Your escrow #${escrowId} was automatically cancelled due to expired fiat payment deadline. The USDC has been refunded to your address. Transaction: ${txHash}`
      );
    }

    if (contact.phone) {
      await this.sendSMS(
        contact.phone,
        `YapBay: Escrow #${escrowId} auto-cancelled. USDC refunded. See details in app.`
      );
    } // Also send in-app notification

    await this.sendInAppNotification(sellerAddress, 'ESCROW_CANCELLED', { escrowId, txHash });
  } // Implementation details for notification methods...
}
```

#### 3. Deployment & Infrastructure

**a. Serverless Function**
You could implement this as an AWS Lambda or similar serverless function triggered on a schedule:

```yaml
# serverless.yml
service: yapbay-auto-cancellation

provider:
  name: aws
  runtime: nodejs14.x
  environment:
    PROVIDER_URL: ${env:PROVIDER_URL}
    ESCROW_CONTRACT_ADDRESS: ${env:ESCROW_CONTRACT_ADDRESS}
    ARBITRATOR_PRIVATE_KEY: ${env:ARBITRATOR_PRIVATE_KEY}

functions:
  checkExpiredEscrows:
    handler: src/handler.checkExpiredEscrows
    events:
      - schedule: rate(10 minutes)
```

**b. Docker Container**
Alternatively, as a Docker container with proper secret management:

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD [""node"", ""dist/scheduler.js""]
```

#### 4. Monitoring & Alert System

- Set up CloudWatch or similar monitoring for the service
- Create alerts for:
    - Failed cancellations
    - High number of auto-cancellations (might indicate a system issue)
    - Service errors or failures
- Implement a dashboard showing:
    - Auto-cancellation rate over time
    - Success/failure statistics
    - Gas usage metrics

#### 5. Testing Strategy

**a. Unit Tests**

- Test the eligibility checking logic
- Test cancellation execution with mocks
- Test notification delivery

**b. Integration Tests**

- Test against a local blockchain with time manipulation
- Verify database updates

**c. End-to-End Tests**

- Deploy to testnet
- Create test escrows and manipulate blockchain time
- Verify full flow works correctly

## Conclusion

With the addition of the `isEligibleForAutoCancel` view function and the detailed backend monitoring service design, you now have a comprehensive solution for automating the cancellation of expired escrows.

The existing contract functionality (`cancelEscrow` for manual cancellation and `autoCancel` for programmatic cancellation) combined with this new query function and backend service will ensure that:

1. Escrows with expired fiat payment deadlines can be easily identified
2. The arbitrator can reliably cancel these escrows through automated processes
3. Sellers will receive their refunds promptly and automatically
4. All parties will be notified of the cancellation

This approach maintains the clean separation of concerns in your existing contract while adding the necessary infrastructure to automate the process, ensuring no funds remain locked in ""de facto canceled"" escrows.

",Deploy YapBay to Celo Mainnet,,,,High,Off track
"1210358746267532",2025-05-23,2025-05-30,2025-05-30,Improve YapBay contracts and put on mainnet so I can participate in Divvi ,To do,George Donnelly,george.donnelly@gmail.com,2025-05-30,2025-05-30,,"https://docs.divvi.xyz/builder-camp
https://app.divvi.xyz/builders/onboarding
https://docs.google.com/forms/d/e/1FAIpQLScTXExYljGoWsw4-mMHf7nXUxXV6QSrXa5zUMPK2foUwpdwZQ/viewform
https://x.com/CeloDevs/status/1917957190151012692

### Improve Contract and Deploy on Mainnet<!-- {""fold"":true} -->

11. contract: Refund when Mark Fiat Paid timer runs out but escrow is still funded.. refund and then cancel both trade in db, escrow in db and on-chain escrow
12. do a full restart: clear db, start over, re-deploy updated contract (on mainnet) (See YapBayEscrow.sol in frontend repo)
13. also consider needed changes for API and db to account for updated contract
14. integrate divvi

#### Contract Update Notes<!-- {""fold"":true} -->

Added Per-Escrow Balance Tracking:
Created a new mapping escrowBalances to track each escrow's actual balance
Updated the balance when an escrow is funded
Updated Balance on State Changes:
Set balance to 0 when an escrow is released
Set balance to 0 when an escrow is cancelled
Added appropriate balance updates in all relevant functions
Added Balance Events:
Created a new event EscrowBalanceChanged to track balance changes
Emitted this event whenever an escrow's balance changes, with a reason
Added Balance Query Functions:
getEscrowBalance: Returns the tracked balance for an escrow
getActualEscrowBalance: Returns the balance based on escrow state and type

##### Automatic Refund Plan

Based on my analysis of the codebase, I'll create a detailed plan for implementing an automatic refund mechanism when the ""mark fiat paid"" deadline expires. This plan takes into account the existing architecture and the memory about the escrow balance bug fix.

Detailed Plan: Automatic USDC Refund for Expired ""Mark Fiat Paid"" Deadline
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
Pass an appropriate onExpire callback to the TradeTimer for the ""mark fiat paid"" deadline
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
Would you like me to proceed with implementing this plan or would you like to discuss any specific aspects in more detai

## implement the solidity enhancements to the rust program

## YapBay bug clean up and fixes

2.
3. review state ref escrows trades and trade checklist
4. improve the dev/prod env var management
5. get the new pods to restart on boot
6. create some views in mathesar, get a handle on that [https://db.panmoni.com/db/7/schemas/2200/tables/22638/30](https://db.panmoni.com/db/7/schemas/2200/tables/22638/30)
7. dig into the transactions and the data being returned to clear some of these unknown results and get more complete data
8. is TradePage finally updating when trade is updated?
9. MyTradesPage lag to update",Deploy YapBay to Celo Mainnet,,,,,
   "1210358746267538",2025-05-23,2025-06-03,2025-06-03,refactoring and reliability,To do,George Donnelly,george.donnelly@gmail.com,2025-06-02,2025-06-03,,"11. refactor:
10. refactor: useUserAccount for Account Page?
11.
12. integrate thirdweb as backup or even primary RPC (https://thirdweb.com/team/panmoni/YapBay-90f2e3)
13. will events be more reliable as its own process?

#### Refactor API Notes<!-- {""fold"":true} -->

Based on my analysis of the codebase, I'll create a detailed refactoring plan for the route files. The current structure has several issues:

The routes.ts file is extremely long (1373 lines)
transactionRoutes.ts is also quite large (761 lines)
The event listener file is large as well (724 lines)
There's a mix of concerns in these files (authentication, middleware, route handlers)
Detailed Refactoring Plan

1. Create a Modular Route Structure
   1.1 Core Directory Structure
   CopyInsert
   src/
   ├── routes/                  # Main routes directory
   │   ├── index.ts             # Exports all routes, sets up common middleware
   │   ├── auth/                # Authentication related routes
   │   │   ├── index.ts         # Exports all auth routes
   │   │   ├── middleware.ts    # JWT verification, admin checks
   │   │   └── handlers.ts      # Login handlers
   │   ├── accounts/            # Account management routes
   │   │   ├── index.ts
   │   │   ├── middleware.ts    # Account-specific middleware
   │   │   └── handlers.ts      # Account CRUD operations
   │   ├── offers/              # Offer-related routes
   │   │   ├── index.ts
   │   │   └── handlers.ts      # Offer CRUD operations
   │   ├── transactions/        # Transaction routes (refactored from transactionRoutes.ts)
   │   │   ├── index.ts
   │   │   ├── middleware.ts    # Transaction-specific middleware
   │   │   └── handlers.ts      # Transaction operations
   │   ├── escrows/             # Escrow-related routes
   │   │   ├── index.ts
   │   │   └── handlers.ts      # Escrow operations
   │   ├── admin/               # Admin routes (refactored from adminRoutes.ts)
   │   │   ├── index.ts
   │   │   └── handlers.ts      # Admin operations
   │   └── health/              # Health check endpoint
   │       ├── index.ts
   │       └── handlers.ts
   ├── middleware/              # Global middleware
   │   ├── errorHandler.ts      # Already exists
   │   ├── auth.ts              # Authentication middleware
   │   └── logging.ts           # Logging middleware
   └── listeners/               # Event listeners
       ├── index.ts             # Main listener setup
       ├── handlers/            # Event-specific handlers
       │   ├── escrow.ts        # Escrow event handlers
       │   ├── dispute.ts       # Dispute event handlers
       │   └── sequential.ts    # Sequential address handlers
       └── utils.ts             # Helper functions for listeners
2. Detailed Implementation Plan
   2.1 Middleware Refactoring
   Move all authentication middleware to src/middleware/auth.ts:
   requireJWT
   requireAdmin
   restrictToOwner
   Create a common logging middleware in src/middleware/logging.ts:
   Move the request logger from routes.ts
   2.2 Routes Refactoring
   2.2.1 Main Router Setup (src/routes/index.ts)
   typescript
   CopyInsert
   import express, { Router } from 'express';
   import { requestLogger } from '../middleware/logging';
   import authRoutes from './auth';
   import accountRoutes from './accounts';
   import offerRoutes from './offers';
   import transactionRoutes from './transactions';
   import escrowRoutes from './escrows';
   import adminRoutes from './admin';
   import healthRoutes from './health';

const router = express.Router();

// Apply global middleware
router.use(requestLogger);

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/offers', offerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/escrows', escrowRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

export default router;
2.2.2 Auth Routes (src/routes/auth/index.ts and handlers)
Move the admin login route and JWT verification to this module.

2.2.3 Account Routes (src/routes/accounts/index.ts and handlers)
Move all account-related endpoints from routes.ts:

/accounts
/accounts/me
/accounts/:id
2.2.4 Offer Routes (src/routes/offers/index.ts and handlers)
Move all offer-related endpoints from routes.ts:

/offers
/offers/:id
2.2.5 Transaction Routes (src/routes/transactions/index.ts and handlers)
Refactor the current transactionRoutes.ts into this module with proper separation of concerns.

2.2.6 Escrow Routes (src/routes/escrows/index.ts and handlers)
Move all escrow-related endpoints from routes.ts.

2.2.7 Admin Routes (src/routes/admin/index.ts and handlers)
Refactor the current adminRoutes.ts into this module.

2.2.8 Health Routes (src/routes/health/index.ts and handlers)
Move the health check endpoint from routes.ts.

2.3 Event Listener Refactoring
Split the large event listener file into smaller, focused modules:
src/listeners/index.ts: Main setup and configuration
src/listeners/handlers/escrow.ts: Handle escrow-related events
src/listeners/handlers/dispute.ts: Handle dispute-related events
src/listeners/handlers/sequential.ts: Handle sequential address events
Create utility functions in src/listeners/utils.ts for common operations:
Logging
Error handling
Event parsing 3. Implementation Strategy
3.1 Phased Approach
Phase 1: Create the directory structure and skeleton files
Set up all directories and empty files
Update imports/exports to maintain the current functionality
Phase 2: Refactor middleware
Move authentication middleware to dedicated files
Update imports in existing files
Phase 3: Refactor routes one module at a time
Start with smaller modules (health, admin)
Move to medium-sized modules (accounts, offers)
Finally, tackle complex modules (transactions, escrows)
Phase 4: Refactor the event listener
Split by event type
Create utility functions for common operations
Phase 5: Testing and validation
Ensure all routes work as expected
Verify event listener functionality
3.2 Testing Strategy
Create unit tests for each route handler
Create integration tests for complete route flows
Test event listeners with mock events 4. Code Quality Improvements
Consistent Error Handling
Use the withErrorHandling wrapper consistently
Create custom error classes for different error types
Type Safety
Create proper interfaces for all request/response objects
Use consistent typing across the codebase
Documentation
Add JSDoc comments to all functions
Document the purpose of each route module
Code Style
Apply consistent formatting
Use meaningful variable names
Remove commented-out code 5. Benefits of This Refactoring
Improved Maintainability
Smaller files are easier to understand and modify
Clear separation of concerns
Better Testability
Isolated components are easier to test
Reduced dependencies between modules
Enhanced Readability
Logical grouping of related functionality
Clear file and directory structure
Easier Onboarding
New developers can understand the codebase more quickly
Clear boundaries between different parts of the application
Scalability
New features can be added in their own modules
Existing modules can be extended without affecting others
Would you like me to elaborate on any specific part of this refactoring plan or provide more detailed code examples for any of the modules?

## enhance mvp features

implement cancel escrow/trade

- telegram auto fill on profile
- notifs system on site, email and tg notifs
- test mobile layout

* - move usdc balance out of dropdown to underneath or enxt to dynamic widget or make a my balances page?",Deploy YapBay to Celo Mainnet

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
