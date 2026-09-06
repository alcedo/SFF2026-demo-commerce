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
cp .env.example .env.local
node scripts/generate-wallets.mjs
```

Edit `.env.local` with the generated merchant address and keys.

Fund the buyer wallet on Sepolia:

1. Sepolia ETH for gas (any public faucet)
2. USDC from the [Circle faucet](https://faucet.circle.com/) for Sepolia

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
