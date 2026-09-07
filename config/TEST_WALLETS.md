# Test Wallets

Sepolia testnet wallets used for VoucherShop development and E2E tests.

> **Testnet only.** These keys are committed so cloud agents and teammates can reuse the same wallets across sessions. Never reuse this pattern on mainnet.

## Addresses

| Role | Address |
|------|---------|
| Merchant (receives USDC) | `0x006450335E618A9Fae2ad89542af411C8668d87D` |
| Test buyer (E2E script) | `0xE432A39eA2303dD8DD71C4afEc65AFa904AfB6Cb` |

Private keys live in [`config/test-wallets.env`](./test-wallets.env).

## Quick setup

```bash
npm run setup:env
```

This copies `config/test-wallets.env` → `.env.local`.

## Funding

### Automated E2E (Anvil fork)

No manual faucet needed. Start an Anvil Sepolia fork, then:

```bash
anvil --fork-url https://ethereum-sepolia-rpc.publicnode.com --port 8545 --chain-id 11155111
npm run test:e2e
```

The `fund-fork.mjs` script impersonates a USDC whale and sends 100 USDC + 1 ETH to the buyer.

Ten independent buyers (fresh keys, distinct HD deposits, poll detection, `DEMO_AUTO_PAY=0`):

```bash
anvil --fork-url https://ethereum-sepolia-rpc.publicnode.com --port 8545 --chain-id 11155111
npm run dev:anvil
npm run test:e2e:ten
```

`dev:anvil` loads `config/test-wallets.env` then `config/anvil.env` and serves the shop on `http://127.0.0.1:4010`.

### Live Sepolia (MetaMask / manual testing)

Fund the **buyer** address:

1. **USDC** — [Circle faucet](https://faucet.circle.com/) → Ethereum Sepolia → `0xE432A39eA2303dD8DD71C4afEc65AFa904AfB6Cb`
2. **ETH** (gas) — [pk910 PoW faucet](https://sepolia-faucet.pk910.de/) → same address

Switch `.env.local` RPC to the public Sepolia endpoints (uncomment in `test-wallets.env`).

## Regenerate wallets

```bash
node scripts/generate-wallets.mjs
```

Update `config/test-wallets.env` with the new output if you rotate keys.
