# YapBay Frontend Development Plan

## Work thru trade flow & fix bugs

- NEXT: chrome as acct2 take an offer of acct1 and see where it goes.

hmr when I edit plan.md derfgit

## when launching trade confirmation dialog, aria warning

locked aria-hidden on an element because its descendant retained focus. The focus must not be hidden from assistive technology users. Avoid using aria-hidden on a focused element or its ancestor. Consider using the inert attribute instead, which will also prevent focus. For more details, see the aria-hidden section of the WAI-ARIA specification at https://w3c.github.io/aria/#aria-hidden.
Element with focus: <input.file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-neutral-100#amount>
Ancestor with aria-hidden: <div.data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg bg-neutral-100 z-50 max-w-md w-full#radix-:r27:>

<div role="dialog" id="radix-:r27:" aria-describedby="radix-:r29:" aria-labelledby="radix-:r28:" data-state="open" data-slot="dialog-content" class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg bg-neutral-100 z-50 max-w-md w-full" tabindex="-1" data-aria-hidden="true" aria-hidden="true" data-protonpass-form="" style="pointer-events: auto;"><div data-slot="dialog-header" class="flex flex-col gap-2 text-center sm:text-left"><h2 id="radix-:r28:" data-slot="dialog-title" class="text-lg leading-none font-semibold">Confirm Trade Details</h2><p id="radix-:r29:" data-slot="dialog-description" class="text-muted-foreground text-sm">Review the details of this trade before confirming.</p></div><div class="space-y-1 mb-4 mt-2"><div class="flex justify-between items-center p-2 bg-neutral-100 rounded"><span class="font-medium text-neutral-700">Trade Type</span><span class="px-2 py-1 rounded-full text-xs font-medium bg-secondary-200 text-secondary-900">You are selling USDC</span></div><div class="flex justify-between items-center p-2 bg-neutral-100 rounded"><span class="font-medium text-neutral-700">Token</span><span>USDC</span></div><div class="flex justify-between items-center p-2 bg-neutral-100 rounded"><span class="font-medium text-neutral-700">Current Market Price</span><span>1 USD</span></div><div class="flex flex-col p-2 bg-neutral-100 rounded"><div class="flex justify-between items-center"><span class="font-medium text-neutral-700">Rate Adjustment</span><span class="text-green-600">+5.00%</span></div><div class="text-xs text-neutral-500 mt-1">You are selling USDC at 5.00% above the market price.</div></div><div class="space-y-2"><label data-slot="label" class="flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" for="amount">Amount (USDC)</label><div class="flex items-center space-x-2"><input type="text" data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-neutral-100" id="amount" inputmode="decimal" placeholder="Enter amount (1.000000 - 10.000000)" min="1.000000" max="10.000000" step="0.01" value="1.000000"><span class="text-neutral-600 text-sm">USDC</span></div><div class="flex flex-col gap-1"><span class="text-neutral-600 text-xs">Your current balance: 10 USDC</span></div></div><div class="space-y-3 py-3 bg-neutral-100 rounded"><div class="font-medium text-neutral-700 border-b pb-1 mb-2">Details</div><div class="flex justify-between items-center"><span class="text-sm text-neutral-700">You are selling</span><span class="font-medium">1 USDC</span></div><div class="flex justify-between items-center"><span class="text-sm text-neutral-700">YapBay Fee (1%)</span><span class="font-medium">0.01 USDC</span></div><div class="text-xs text-neutral-500 pl-2"><span>50% of this fee can go to the referral program</span></div><div class="flex justify-between items-center"><span class="text-sm text-neutral-700">You will escrow</span><span class="font-medium">1.01 USDC</span></div><div class="pt-2 mt-2 flex justify-between items-center bg-amber-100 rounded p-2"><span class="font-medium text-neutral-700">You will receive</span><span class="font-bold text-primary-800">1.05 USD</span></div></div><div class="text-xs text-neutral-500 p-2 bg-neutral-100 rounded"><p>Escrow Deposit Time Limit: 15 minutes</p><p class="mt-1">Fiat Payment Time Limit: 30 minutes</p></div><div class="p-3 bg-primary-100 text-primary-800 rounded text-sm"><p><strong>Note:</strong> As the seller, you will be prompted to create the on-chain escrow account and to pay for it in SOL. Please ensure you have sufficient <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center">devnet SOL<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link ml-1 h-3 w-3"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg></a> and <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center">devnet USDC<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link ml-1 h-3 w-3"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg></a>.</p></div></div><div data-slot="dialog-footer" class="flex-col-reverse sm:flex-row sm:justify-end mt-4 flex gap-2 justify-end"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[&gt;svg]:px-3 w-36">Cancel</button><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shadow-xs h-9 px-4 py-2 has-[&gt;svg]:px-3 bg-secondary-500 hover:bg-secondary-600 text-white w-36">Initiate Trade</button></div><button type="button" class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg><span class="sr-only">Close</span></button></div>

## My Txs & Escrows

- all of the my pages seem to work however I think for txs and escrow there will be an adjustment to the data format to include the network.

## Connect Wallet to Trade button not working

not on home on desktop offer table nor on detail page where it is grayed out

src/components/Home/MobileOfferList.tsx: Connect Wallet to Trade
src/components/Home/DesktopOfferTable.tsx: Connect Wallet to Trade
src/offer/OfferDetailPage.tsx:

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

- implement cancel escrow/trade
- test mobile layout
- move usdc balance out of dropdown to underneath or enxt to dynamic widget or make a my balances page?
- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?
- make sure RPC is efficient, maybe cache some of them.. run it through a redis/valkey?

## Ref

Fee flag is now enabled

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
