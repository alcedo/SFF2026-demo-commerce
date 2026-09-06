# VoucherShop

Buy digital gift cards with USDC on Ethereum Sepolia.

The storefront matches the VoucherShop screens: catalog, quantity checkout, send-to-address payment, voucher reveal, and an admin inventory panel.

## Setup

```bash
cd voucher-shop
npm install
npm run setup:env
npm run dev
```

Open http://localhost:3000

Default admin login is `admin` / `admin123`.

## Payment

Checkout shows the merchant address. Send the exact USDC amount on Sepolia. The app polls for a matching transfer, then reveals the codes.

`DEMO_AUTO_PAY` defaults on. After about 8 seconds the order fulfills so you can walk the UI without a wallet. Set `DEMO_AUTO_PAY=0` to require a real transfer.

On-chain checks still run through `src/lib/payment.ts` and `POST /api/orders/[id]/verify`.

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

## E2E

With the app running against an Anvil Sepolia fork:

```bash
npm run test:e2e
```
