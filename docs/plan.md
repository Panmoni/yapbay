# YapBay Frontend Development Plan

## API integration

- log in as user 3, create account
- migrate old testing metamask accts from brave

## Trade Page

- listener vs RPC on page... maybe I need both.

## Next Test

NEXT: re-test flow up to mark fiat paid and ensure API works and state updates on the frontend

When funding escrow, is the transaction getting recorded to the API?

when recording the escrow it is saving its state as the trade state, not the escrow state.

## escrow

- release escrow
- cancel escrow
- auto cancel
- event listener?
- error handling?

## Diagnostic tool / admin dashboard

create a diagnostic tool to collate info from on-chain via RPC, trades db, escrows db, transaction db.

forerunner queryEscrowsBalances.ts

## Future Normalization

- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?
- useUserAccount for Account Page?

## Ref

https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C
