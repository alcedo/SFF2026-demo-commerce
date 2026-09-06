# VoucherVault

Digital voucher e-commerce store that accepts USDC stablecoin payments on Ethereum Sepolia testnet.

## Features

- Browse and purchase digital gift vouchers
- Pay with USDC via connected wallet on Sepolia
- On-chain payment verification before voucher delivery
- Copy voucher code after successful purchase
- Admin panel to add voucher codes and view inventory
- Redeem page marks vouchers as used in SQLite

## Stack

- Next.js (App Router)
- SQLite via better-sqlite3
- wagmi + viem for wallet and payment verification

## Setup

```bash
cd voucher-shop
npm install
npm run setup:env
```

This copies committed test wallets from `config/test-wallets.env` into `.env.local`. See [`config/TEST_WALLETS.md`](config/TEST_WALLETS.md) for addresses and funding steps.

To generate fresh wallets instead:

```bash
node scripts/generate-wallets.mjs
```

Edit `config/test-wallets.env` with the output if you rotate keys.

## Run

```bash
npm run dev
```

Open http://localhost:3000

- **Shop**: browse vouchers
- **Checkout**: connect wallet, reserve voucher, pay USDC
- **Admin**: password from `ADMIN_PASSWORD` (default `admin123`)
- **Redeem**: mark a purchased voucher as used

## E2E test

With the dev server running:

```bash
node scripts/e2e-purchase.mjs
```

## Payment flow

1. User reserves a voucher (order created, voucher held)
2. User sends USDC to merchant address via wallet
3. Backend verifies the on-chain transfer
4. Voucher code is revealed on the order page
