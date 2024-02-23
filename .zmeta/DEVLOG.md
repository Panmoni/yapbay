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

module.exports = {
plugins: {
tailwindcss: {},
autoprefixer: {},
},
};

{ link: "/app", label: "App" },
{ link: "/blog", label: "Blog" },
{ link: "/about", label: "About" },
{ link: "/roadmap", label: "Roadmap" },
{ link: "/contact", label: "Contact" },

/////////////////////////////////////

## TODO

- [ ] write first blog post, maybe adapt from koinfix, remove old posts
- [ ] start daily building in public vlogs.

### Metadata

- [ ] website metadata
- [ ] clean up blog stuff in public/assets/blog, and favicons. See blog layout for the head stuff for the icons and put it also in the root layout

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
