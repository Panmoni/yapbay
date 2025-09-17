# YapBay Frontend Development Plan

sanity check on what is being recorded to mathesar for escrows, transactions

show network on my escrows pages?

- NEXT: get full trade page working, test out the blockchain flow, list of transactions, etc

- acct1 see transactions and escrows they did not create

- my escrows amounts are wrong but my transactions gets it right.

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
