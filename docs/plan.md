# YapBay Frontend Development Plan

NEXT: re-test flow up to mark fiat paid and ensure API works and state updates on the frontend

create a diagnostic tool to collate info from on-chain via RPC, trades db, escrows db, transaction db.

sonner top right

## trade 8

[TRADE] 
Object { id: 8, leg1_offer_id: 7, leg2_offer_id: null, overall_status: "IN_PROGRESS", from_fiat_currency: "USD", destination_fiat_currency: "USD", from_bank: null, destination_bank: null, created_at: "2025-04-23T20:18:33.165Z", updated_at: "2025-04-23T20:18:33.165Z", … }
TradePage.tsx:85:13
Trade is in CREATED state TradeStatusDisplay.tsx:122:16
User is seller, escrow deadline expired: false TradeStatusDisplay.tsx:124:18
[DEBUG] User-requested decision logic: Evaluating renderTimers for state: CREATED TradeStatusDisplay.tsx:216:12
[DEBUG] User-requested decision logic: Rendering timer for CREATED state. Deadline: 2025-04-23T20:33:33.165Z, Expired: false TradeStatusDisplay.tsx:220:14
Trade is in CREATED state TradeStatusDisplay.tsx:122:16
User is seller, escrow deadline expired: false TradeStatusDisplay.tsx:124:18
[DEBUG] User-requested decision logic: Evaluating renderTimers for state: CREATED TradeStatusDisplay.tsx:216:12
[DEBUG] User-requested decision logic: Rendering timer for CREATED state. Deadline: 2025-04-23T20:33:33.165Z, Expired: false TradeStatusDisplay.tsx:220:14
[DEBUG] Creating escrow with parameters: 
Object { tradeId: 8n, buyer: "0xDD304336Cf878dF7d2647435D5f57C2345B140C1", amount: "2220000", sequential: false, sequentialEscrowAddress: "0x0000000000000000000000000000000000000000", arbitrator: "0x6d2dAaA22a90AC8721D1f9C207D817AB7C490383" }
blockchainService.ts:82:10
Trade is in CREATED state TradeStatusDisplay.tsx:122:16
User is seller, escrow deadline expired: false TradeStatusDisplay.tsx:124:18
[DEBUG] User-requested decision logic: Evaluating renderTimers for state: CREATED TradeStatusDisplay.tsx:216:12
[DEBUG] User-requested decision logic: Rendering timer for CREATED state. Deadline: 2025-04-23T20:33:33.165Z, Expired: false TradeStatusDisplay.tsx:220:14
Trade is in CREATED state TradeStatusDisplay.tsx:122:16
User is seller, escrow deadline expired: false TradeStatusDisplay.tsx:124:18
[DEBUG] User-requested decision logic: Evaluating renderTimers for state: CREATED TradeStatusDisplay.tsx:216:12
[DEBUG] User-requested decision logic: Rendering timer for CREATED state. Deadline: 2025-04-23T20:33:33.165Z, Expired: false TradeStatusDisplay.tsx:220:14
[DEBUG] Transaction sent: 0x8715a857fcd9727beadd843547dc04cec704fed18a64a3f18e089f345983de8c blockchainService.ts:108:12
[DEBUG] Transaction confirmed: 
Object { blockHash: "0x31b4f05a048bb0269bdfd6dec27b40011c0c429bdefba06045cfda8be42270c2", blockNumber: 44484216n, contractAddress: null, cumulativeGasUsed: 445115n, effectiveGasPrice: 25001000000n, from: "0x14140b0dbc4736124ea9f5230d851f62f99b0ac5", gasUsed: 219597n, l1BaseFeeScalar: "0x0", l1BlobBaseFee: "0x1", l1BlobBaseFeeScalar: "0x0", … }
blockchainService.ts:113:12
[DEBUG] Escrow ID (string): 13 blockchainService.ts:154:12
[DEBUG] Transaction result: 
Object { escrowId: "13", txHash: "0x8715a857fcd9727beadd843547dc04cec704fed18a64a3f18e089f345983de8c", blockNumber: 44484216n }
TradePage.tsx:139:14
[DEBUG] Recording escrow with data: 
Object { trade_id: 8, transaction_hash: "0x8715a857fcd9727beadd843547dc04cec704fed18a64a3f18e089f345983de8c", escrow_id: "13", seller: "0x14140b0dbC4736124ea9F5230D851f62F99b0ac5", buyer: "0xDD304336Cf878dF7d2647435D5f57C2345B140C1", amount: 2.22, sequential: false, arbitrator: "0x6d2dAaA22a90AC8721D1f9C207D817AB7C490383" }
TradePage.tsx:153:14
[DEBUG] Record escrow response: 
Object { data: {…}, status: 200, statusText: "OK", headers: {…}, config: {…}, request: XMLHttpRequest }

the fund escrow transaction did not get recorded to db I believe but the create one did

## Refs
Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?

Check the render method of `Primitive.button.SlotClone`.
Button@http://localhost:5173/src/components/ui/button.tsx:52:16
createSlotClone/SlotClone<@http://localhost:5173/node_modules/.vite/deps/chunk-EE27S72H.js?v=044397f3:95:40
createSlot/Slot2<@http://localhost:5173/node_modules/.vite/deps/chunk-EE27S72H.js?v=044397f3:72:40
Primitive</Node<@http://localhost:5173/node_modules/.vite/deps/chunk-HBQSP3LI.js?v=044397f3:55:44
DialogTrigger<@http://localhost:5173/node_modules/.vite/deps/@radix-ui_react-dialog.js?v=044397f3:101:48
DialogTrigger@http://localhost:5173/src/components/ui/dialog.tsx:37:23
Provider@http://localhost:5173/node_modules/.vite/deps/chunk-CUALNBS3.js?v=044397f3:51:47
Dialog@http://localhost:5173/node_modules/.vite/deps/@radix-ui_react-dialog.js?v=044397f3:72:7
Dialog@http://localhost:5173/src/components/ui/dialog.tsx:27:16
TradeConfirmationDialog@http://localhost:5173/src/components/TradeConfirmationDialog.tsx:40:33
div
div
div
div
CardContent@http://localhost:5173/src/components/ui/card.tsx:129:21
div
Card@http://localhost:5173/src/components/ui/card.tsx:25:14
div
Provider@http://localhost:5173/node_modules/.vite/deps/chunk-CUALNBS3.js?v=044397f3:51:47
TooltipProvider@http://localhost:5173/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=044397f3:77:7
TooltipProvider@http://localhost:5173/src/components/ui/tooltip.tsx:26:25
OffersPage@http://localhost:5173/src/Home.tsx:58:29
RenderedRoute@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=044397f3:5904:23
Routes@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=044397f3:6634:16
div
Container@http://localhost:5173/src/components/Container.tsx:24:19
main
div
Router@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=044397f3:6577:16
BrowserRouter@http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=044397f3:8829:23
App@http://localhost:5173/src/App.tsx?t=1745439159740:44:29
ErrorBoundaryExclude@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47541:28
SocialRedirectContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:36024:37
PhantomRedirectContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47751:38
ConnectWithOtpProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:46227:30
UserFieldEditorContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:33396:38
WalletGroupContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:31895:34
SendBalanceContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:30098:34
AccessDeniedContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:13755:35
OnrampContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:25722:29
DynamicBridgeWidgetContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47365:42
DynamicWidgetContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:28676:36
PasskeyContextProviderWithBrowser@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:28545:41
PasskeyContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:28634:30
VerificationProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:13869:28
WalletContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:17000:29
AccountExistsContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:13782:36
CaptchaContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:7997:30
ViewContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:7161:27
LoadingContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:34780:30
ThemeContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:14040:28
WalletBookContextProvider@http://localhost:5173/node_modules/.vite/deps/chunk-NJNQWHET.js?v=044397f3:21360:33
I18nextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:7897:7
InnerDynamicContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:48457:80
WidgetRegistryContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47400:37
IpConfigurationContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:22305:38
FieldsStateProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:17197:27
UserWalletsProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:13803:27
ErrorContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:7125:28
ErrorBoundaryReporter@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47500:5
ErrorBoundary@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47531:22
ReinitializeContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:47788:35
DynamicContextProvider@http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=044397f3:49003:27 chunk-ROX75MGY.js:7410:37




## API integration
- log in as user 3, create account
- migrate all old testing accounts to zen from brave, chrome, etc... also arbitrator address and yapbay funding address

## escrow
- mark fiat paid
- release escrow
- cancel escrow
- auto cancel
- event listener?
- error handling?

## Trade Page
- if I'm going to update via RPC on the state of the escrow at any given time, do I need listener? Do I need to be checking the API? Normalize that.
- refactor

## Ref
https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C