# YapBay Frontend Development Plan

slim down the my pages

User is buyer, showing mark_paid button getAvailableActions.ts:49:16
dial down

## Trade Page

- if I'm going to update via RPC on the state of the escrow at any given time, do I need listener? Do I need to be checking the API? Normalize that.
- customize sonners https://sonner.emilkowal.ski/toast

## API integration

- log in as user 3, create account
- migrate all old testing accounts to zen from brave, chrome, etc... also arbitrator address and yapbay funding address

## Diagnostic tool

create a diagnostic tool to collate info from on-chain via RPC, trades db, escrows db, transaction db.

## NExt Test

NEXT: re-test flow up to mark fiat paid and ensure API works and state updates on the frontend

When funding escrow, is the transaction getting recorded to the API?

refresh my understanding of trade states

## escrow

- release escrow
- cancel escrow
- auto cancel
- event listener?
- error handling?

when recording the escrow it is saving its state as the trade state, not the escrow state.

## Future Normalization

- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings?
- useUserAccount for Account Page?

## Ref

https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C
