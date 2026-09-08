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

Checkout shows the catalog USDC amount and a deposit address from the merchant HD tree (`m/44'/60'/0'/0/n` via `MERCHANT_PRIVATE_KEY`). If that env var is unset, the demo seed from `config/test-wallets.env` is used. On Vercel, paste 64 hex characters (optional `0x`, no quotes). A value that is not 64 hex chars still fails checkout. Live invoices hold distinct indexes. Cancel or a 30-minute TTL expires the invoice, releases reserved codes, and returns that index to the pool. A paid index is never reused. The app polls for a USDC transfer to the current address, then reveals the codes.

Funds stay on the derived address until you sweep them to the treasury `MERCHANT_ADDRESS`. Child private keys are never sent to the browser.

`DEMO_AUTO_PAY` defaults on. After about 8 seconds the order fulfills so you can walk the UI without a wallet. Set `DEMO_AUTO_PAY=0` to require a real transfer.

On-chain checks still run through `src/lib/payment.ts` and `POST /api/orders/[id]/verify`.

Orders use a signed id (`slug.qty.timestamp.index.hmac`). When `DATABASE_URL` is set (Vercel Marketplace Neon), products, orders, and voucher stock live in Postgres so every isolate sees the same reservations. Without `DATABASE_URL`, the app keeps a JSON snapshot (`data/vouchershop.json` locally, `/tmp` on Vercel) and can rebuild a pending invoice from the signed id.

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
npm run verify:concurrent
```

`verify:purchase` buys quantity 3 on one Amazon order. `verify:concurrent` fires three quantity-1 Amazon orders at the same time and fails unless each order gets a distinct deposit address.

With an Anvil Sepolia fork on port 8545, and `.env.local` pointed at that RPC:

```bash
anvil --fork-url https://ethereum-sepolia-rpc.publicnode.com --port 8545 --chain-id 11155111
# set SEPOLIA_RPC_URL=http://127.0.0.1:8545 in .env.local
npm run test:e2e
```

Ten buyers on the same fork (`DEMO_AUTO_PAY=0`, shop on port 4010):

```bash
anvil --fork-url https://ethereum-sepolia-rpc.publicnode.com --port 8545 --chain-id 11155111
npm run dev:anvil
npm run test:e2e:ten
```
