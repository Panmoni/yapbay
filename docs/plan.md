# YapBay Frontend Development Plan

test immediate prompt to fund after escrow creation

test recording of all events

test update of escrow, trade tables for events

- when recording the escrow it is saving its state as the trade state, not the escrow state.

## events table

contract events table needs more data and to have the trade_id field in there

## record all txs

Need a route to record follow on transactions

## refunds

if the escrow is funded and mark paid fails to meet deadline, gotta refund the USDC

## escrow

- release escrow
- cancel escrow

## Roadmap

- Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings pages?
- useUserAccount for Account Page?
- make sure RPC is efficient, maybe cache some of them.. run it through a redis?

## Ref

https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C
