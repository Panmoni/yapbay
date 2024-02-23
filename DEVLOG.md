# DevLog

## 2024-02-19T22:14:23.3NZ

hello@yapbay.com

mantine does not use tailwind.

## 2024-02-20T16:42:24.3NZ

Working on roadmap

## 2024-02-23T16:17:08.3NZ

creating basic site

tsconfig.json

"paths": {
"@/_": ["./src/_"]
}

/////////////////////////////////////

## TODO

- clean up blog stuff in public
-

- [ ] website metadata
- [ ] add roadmap to website
- [ ] add marketing copy and such to the website.
- [ ] start daily building in public vlogs.
- [ ] add website pages
  - blog
  - about
  - home
  - app
  - roadmap
  - contact

## Contracts

### hub

administrative stuff it seems

### offer

createOffer
updateOffer
register it with the hub
query state
load offer by id

#### offer/state

trade indexes struct for efficient searches

### price

seems to be about just storing prices
ah no it also queries to get fiat

### profile

updates trades count, offer count, telegram handle?

### trade

create trade
expiration time
this is the longest and most complex contract it looks like
