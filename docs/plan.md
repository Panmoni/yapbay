# YapBay Frontend Development Plan

creating and funding escrow are still separate steps, and when we fund the escrow, the database is not getting updated.

This might be a listener failure or maybe the listener does not run often off.

- re-test flow up to mark fiat paid and ensure API works and state updates on the frontend
- When funding escrow, is the transaction getting recorded to the API?
- when recording the escrow it is saving its state as the trade state, not the escrow state.
- ensure listener is working properly.
- check events table and log

## escrow

- release escrow
- cancel escrow

## Roadmap

- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?
- useUserAccount for Account Page?
- make sure RPC is efficient, maybe cache some of them.. run it through a redis?

## Ref

https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C
