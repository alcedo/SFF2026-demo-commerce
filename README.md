# VoucherShop

Buy digital gift cards with USDC on Ethereum Sepolia.

Live site: https://sff-2026-demo-commerce.vercel.app

The storefront is the AgentiX Playground theme. Catalog, quantity checkout, send-to-address payment, voucher reveal, and an admin inventory panel.

## Setup

```bash
npm install
npm run setup:env
npm run dev
```

Open http://localhost:3000

Default admin login is `admin` / `admin123`.

## Payment

Checkout shows the catalog USDC amount and a deposit address derived for that order from `MERCHANT_PRIVATE_KEY`. Send the listed amount on Sepolia to that address. Two $25 checkouts do not share a payment because each order has its own address. The app polls for a transfer to that address, then reveals the codes.

Funds stay on the derived address until you sweep them to the treasury `MERCHANT_ADDRESS`. The derived private key is never sent to the browser.

`DEMO_AUTO_PAY` defaults on. After about 8 seconds the order fulfills so you can walk the UI without a wallet. Set `DEMO_AUTO_PAY=0` to require a real transfer.

On-chain checks still run through `src/lib/payment.ts` and `POST /api/orders/[id]/verify`.

Orders use a signed id (`slug.qty.timestamp.hmac`) so a Vercel isolate can reconstruct a pending purchase without a shared database.

## Routes

- `/` home
- `/vouchers` catalog
- `/vouchers/[slug]` product and quantity
- `/checkout/[orderId]` send USDC
- `/processing/[orderId]` confirmation steps
- `/success/[orderId]` payment receipt
- `/order/[id]` voucher codes
- `/how-it-works` redeem help
- `/admin/login` admin sign-in

## Verify

With the app running:

```bash
npm run verify:purchase
```

With an Anvil Sepolia fork on port 8545, and `.env.local` pointed at that RPC:

```bash
anvil --fork-url https://ethereum-sepolia-rpc.publicnode.com --port 8545 --chain-id 11155111
# set SEPOLIA_RPC_URL=http://127.0.0.1:8545 in .env.local
npm run test:e2e
```
