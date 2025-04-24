# YapBay Frontend Development Plan

put a collapsible legend at bottom of trade page explaining trade stages and escrow stages, with buyer, seller roles, things that can go wrong, etc.

## refactor

TradePage
blockchainService

organize better these components

ChatSection
EscrowDetailsPanel
FilterBar
IntroMessageNotLoggedIn
NoOffers
OfferActionButtons
OfferTypeTooltip
ParticipantCard
ParticipantSection
TradeActionButton
TradeDetailsCard
TradeProgressBar
TradeStatusDisplay
TradeTimer

CreateAccountForm
CreateOfferPage
EditAccountForm
EditOfferPage

new dirs
/myoffers
/mytrades
/myescrows
/trade

Can we use mobileofferlist, desktopoffertabe and offerpagination in other listings?

useUserAccount for Account Page?

stringutils elsewhere?

and fix lint errors npm run lint

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

## Trade Page

- if I'm going to update via RPC on the state of the escrow at any given time, do I need listener? Do I need to be checking the API? Normalize that.
- refactor
- customize sonners https://sonner.emilkowal.ski/toast

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

## Ref

https://celo-alfajores.blockscout.com/address/0xC8BFB8a31fFbAF5c85bD97a1728aC43418B5871C
