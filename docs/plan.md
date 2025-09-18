# YapBay Frontend Development Plan

- NEXT: get full trade page working, test out the blockchain flow, list of transactions, etc

## on next escrow creation

when trades auto cancel the trades.cancelled field is not being updated: check if this is fixed (api) trade 15

Check if deposit_deadline and fiat_deadline are being added upon escrow creation. (api?)

See if trade_id gets recorded for real escrow created event (api)

see if solana transactions are being recorded as signatures, slot, and the correct network_family field. (frontend)

## fund escrow failures

suspect we also have to initilize the token account for the escrow pda?

check to see how tests.ts does it

is the escrow_token_account that is being stored via /escrows/record actually correct?

once we know the solana escrow address, update trade.leg1_escrow_address

\[DEBUG] Solana escrow funded:
{success: false, error: 'Invalid public key input'}
error
:
"Invalid public key input"
success
:
false
\[\[Prototype]]
:
Object
date-fns.js?v=c5acba84:2862 Uncaught RangeError: Invalid time value
at TradeDetailsCard (TradeDetailsCard.tsx:59:14)
TradeDetailsCard @ TradeDetailsCard.tsx:59
E @ inpage.js:166
_ @ inpage.js:166
J @ inpage.js:166
postMessage
d @ inpage.js:166
v @ inpage.js:166
refreshTrade @ tradeService.ts:903
await in refreshTrade
(anonymous) @ TradePage.tsx:61
createEscrow @ useTradeActions.ts:83
await in createEscrow
handleAction @ index.tsx:129
onClick @ renderActionButtons.tsx:41
date-fns.js?v=c5acba84:2862 Uncaught RangeError: Invalid time value
at TradeDetailsCard (TradeDetailsCard.tsx:59:14)
TradeDetailsCard @ TradeDetailsCard.tsx:59
E @ inpage.js:166
_ @ inpage.js:166
J @ inpage.js:166
postMessage
d @ inpage.js:166
v @ inpage.js:166
refreshTrade @ tradeService.ts:903
await in refreshTrade
(anonymous) @ TradePage.tsx:61
createEscrow @ useTradeActions.ts:83
await in createEscrow
handleAction @ index.tsx:129
onClick @ renderActionButtons.tsx:41
inpage.js:166 The above error occurred in the <TradeDetailsCard> component:

    at TradeDetailsCard (http://localhost:5173/src/components/Trade/TradeDetailsCard.tsx:33:29)
    at div
    at TradePage (http://localhost:5173/src/TradePage.tsx?t=1758138711349:56:18)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=c5acba84:5904:26)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=c5acba84:6635:3)
    at div
    at Container (http://localhost:5173/src/components/Shared/Container.tsx:24:22)
    at main
    at div
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=c5acba84:6578:13)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=c5acba84:8830:3)
    at App (http://localhost:5173/src/App.tsx?t=1758137458500:49:29)
    at ErrorBoundaryExclude (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75561:28)
    at SocialRedirectContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:63116:40)
    at PhantomRedirectContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75771:41)
    at ConnectWithOtpProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:74089:33)
    at UserFieldEditorContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:60374:41)
    at WalletGroupContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:58955:37)
    at SendBalanceContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:57265:37)
    at AccessDeniedContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:39628:38)
    at OnrampContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:52795:32)
    at DynamicBridgeWidgetContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75385:45)
    at DynamicWidgetContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:55856:39)
    at PasskeyContextProviderWithBrowser (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:54553:44)
    at PasskeyContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:54653:33)
    at VerificationProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:39744:31)
    at WalletContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:43040:32)
    at AccountExistsContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:39655:39)
    at CaptchaContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:8245:33)
    at ViewContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:7174:30)
    at LoadingContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:61727:33)
    at ThemeContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:39935:31)
    at WalletBookContextProvider (http://localhost:5173/node_modules/.vite/deps/chunk-QFC474OQ.js?v=c5acba84:30608:36)
    at I18nextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:7910:5)
    at InnerDynamicContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:76513:11)
    at WidgetRegistryContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75420:40)
    at IpConfigurationContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:48617:41)
    at FieldsStateProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:43231:30)
    at UserWalletsProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:39676:30)
    at ErrorContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:7138:31)
    at ErrorBoundaryReporter (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75520:5)
    at ErrorBoundary (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75551:9)
    at ReinitializeContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:75808:38)
    at DynamicContextProvider (http://localhost:5173/node_modules/.vite/deps/@dynamic-labs_sdk-react-core.js?v=c5acba84:77057:82)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundaryExclude.
E @ inpage.js:166
\_ @ inpage.js:166
J @ inpage.js:166
postMessage
d @ inpage.js:166
v @ inpage.js:166
refreshTrade @ tradeService.ts:903
await in refreshTrade
(anonymous) @ TradePage.tsx:61
createEscrow @ useTradeActions.ts:83
await in createEscrow
handleAction @ index.tsx:129
onClick @ renderActionButtons.tsx:41

## Post-MVP

review the network awareness/wrapper stuff to ensure it is extensible

### src/config/index.ts

- Get the new env vars in here and draw from them for solana stuff
- update docs for new env vars

### Add payment methods

add pagomovil https://t.me/yuneHR16 perfect payment methods and expose it for direct user management

### Add self-rolled chat

### Improve pricing

https://rapidapi.com/zigzagway/api/binance-p2p-api/playground/apiendpoint_8ede70d4-d835-49c6-858d-0375fd842fbf

need sources for NGN, VES etc that are reliable

### replace redis with https://valkey.io/

### add more notifs: whatsapp, sms, mobile push notifs

- add telegram to profile

### social

strategic friction [https://read.first1000.co/p/positive-friction](https://read.first1000.co/p/positive-friction). User can check in and have a log on the site of which users are checking in. Take inspiration from pump.fun maybe the social feature leverages the chat

### leg2 plan Fiat-to-fiat wizard for efficient currency conversion Get Leg2 Working for Full Remittance Flow

## Clean up and Fixes

- clean up any backwards compatibility with single network flat api/types interfaces, full review of the api types as there some hacks in there.

1. script an easy redeploy of everything in case server dies. Just match postgres backup with github code to re-deploy from scratch
2. review state ref escrows trades and trade checklist
3. improve the dev/prod env var management
4. get the new pods to restart on boot
5. create some views in mathesar, get a handle on that [https://db.panmoni.com/db/7/schemas/2200/tables/22638/30](https://db.panmoni.com/db/7/schemas/2200/tables/22638/30)
6. dig into the transactions and the data being returned to clear some of these unknown results and get more complete data
7. is TradePage finally updating when trade is updated?
8. MyTradesPage lag to update",Deploy YapBay to Celo Mainnet
9. refactor: useUserAccount for Account Page?
10. will events be more reliable as its own process?
11. scour the blockchain stuff to see about types stuff that needs to moved into the appropriate types file so types are centralized

- implement cancel escrow/trade
- test mobile layout
- move usdc balance out of dropdown to underneath or enxt to dynamic widget or make a my balances page?
- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?
- make sure RPC is efficient, maybe cache some of them.. run it through a redis/valkey?

## Ref

Fee flag is now enabled

### inspect a transaction

solana confirm -v 4Qb8Eerb3vxz2NBKioifaqgoM6M7nZdvpwyRzqcjXEaCTsHh1mDYW9kPd94JzqaEEjgFP58c6tgKgoNWyw6HdBnn

### inspect escrows etc

❯ spl-token balance --address 9v8jzPTzKDPF9JXKtMrkdMbZqCFG8nVj8w7LrU5Q1XsP --url devnet
10.1

solana account 8rGJiZqS8e2AhnvmjBnssd9iBuNYSkfewGZR8JQwJMof --url devnet --output json

node scripts/decode-escrow-simple.js 8rGJiZqS8e2AhnvmjBnssd9iBuNYSkfewGZR8JQwJMof --url devnet

### Get latest blockhash

curl -X POST https://distinguished-chaotic-bird.solana-devnet.quiknode.pro/483d675967ac17c1970a9b07fdba88abe17d421e/ \
 -H "Content-Type: application/json" \
 -d '{
"jsonrpc": "2.0",
"id": 1,
"method": "getLatestBlockhash"
}'

### IDL Issues Ref

- https://solana.stackexchange.com/questions/14342/why-does-typescript-throw-a-warning-for-resolvedaccounts-for-my-pda-in-my-anchor
- https://solana.stackexchange.com/questions/16070/typescript-type-error-with-multiple-accounts-in-program-struct
