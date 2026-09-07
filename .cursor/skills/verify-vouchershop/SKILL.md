---
name: verify-vouchershop
description: Drive the VoucherShop AgentiX Playground web storefront (catalog, demo USDC checkout, redeem help, admin inventory) and prove user-facing behavior. Use when verifying shop, purchase, or admin changes.
---

# Verify VoucherShop

Agent-facing control skill for the AgentiX Playground storefront in this repo (package name `voucher-shop`). A user buys digital gift cards with USDC on Sepolia. Default local mode auto-confirms checkout so a walk does not need a wallet.

Read `features/README.md` before driving. Cover the mapped entry points for the feature you claim, not one convenient shortcut.

## Surface

Primary surface: the Next.js web UI.

- Document title: `AgentiX Playground · Digital Vouchers`
- Header brand: `AgentiX` / `Playground`
- Header nav: `Home`, `Vouchers`, `How it works`
- With demo auto-pay on (default): header status `Demo · Sepolia`
- With demo auto-pay off: header status `Live · Sepolia`

Secondary surface: same-origin JSON APIs used by the UI (`/api/products`, `/api/orders`, `/api/orders/:id`, `/api/admin/*`). Use APIs to confirm side effects, not as a substitute for a mapped browser path.

Not a user surface: `npm run verify:purchase` (HTTP-only demo fulfill), `npm run test:e2e` (Anvil + real USDC). Those scripts do not click the storefront.

## Launch

Repo root (this checkout). Next listens on `127.0.0.1`.

Documented human start:

```bash
npm install
npm run setup:env
npm run dev
```

Ready when `GET http://127.0.0.1:3000/` is 200 and the HTML contains `Buy digital vouchers` and `AgentiX`. Dev log prints `Ready`.

Verification start (isolated scratch, pinned port). Do this instead of attaching to a stranger's `:3000`:

```bash
.cursor/skills/verify-vouchershop/scripts/control-vouchershop launch
```

Ready when the command exits 0 and prints a `url`. Default URL is `http://127.0.0.1:4173`. State is `/tmp/vouchershop-verify/current.json`.

`launch` copies the app (including `node_modules`, because Turbopack rejects an out-of-tree symlink) into `/tmp/vouchershop-verify/runs/<run-id>/app`, writes a demo `.env.local` (no wallet keys), and starts `next dev --hostname 127.0.0.1 --port 4173` from that copy. Shop state lives in the copy's `data/vouchershop.json`, not the repo's.

`--in-place` starts from the repo cwd and will read/write `data/vouchershop.json` there. Use it only when you own that tree.

`--port <n>` changes the pinned port. If the port is taken, `launch` fails. It does not hop.

Teardown is `control-vouchershop cleanup` (see Cleanup). Do not `pkill next`.

## Doctor

Run before the first drive, after any failed drive, and on every fresh helper session:

```bash
.cursor/skills/verify-vouchershop/scripts/control-vouchershop doctor
```

Doctor is read-only. It passes only when all of these hold:

- `GET $URL/` is 200
- HTML contains `AgentiX` and `Buy digital vouchers`
- `GET $URL/api/products` is 200 and includes `slug: "amazon"` at `25` USDC
- If `/tmp/vouchershop-verify/current.json` exists: that PID is alive and its `url` matches `$URL`

If demo auto-pay is on, the home HTML also contains `eight seconds` and the header chip `Demo · Sepolia`. If those strings are missing, the instance is not the default verify profile — do not run demo-purchase against it.

If doctor fails, stop driving. Relaunch or reset to a known URL. Do not keep clicking a wedged page on a "healthy" port.

## Drive

Long-lived instance: one `launch` per run, then serial browser drives against that URL. Do not start a second instance against the same shop file.

Browser: Playwright MCP, computerUse, or any CDP session. Prefer role + accessible name, then placeholder / `autocomplete`, then a scoped CSS fallback. There are almost no `aria-*` or `data-testid` hooks.

Stable handles (current copy):

| Intent | Handle |
|---|---|
| Home heading | `getByRole('heading', { level: 1, name: /Buy digital vouchers/ })` |
| Catalog from home | `getByRole('link', { name: 'Enter voucher rails' })` |
| Catalog from nav | `getByRole('link', { name: 'Vouchers' })` |
| Redeem help | `getByRole('link', { name: 'How it works' })` |
| Product card CTA | article that contains heading `Amazon Gift Card` → `getByRole('link', { name: 'Buy now' })` |
| Catalog search | `getByPlaceholder('Search vouchers...')` |
| Category filter | `<select>` whose first option is `All Categories` |
| Product buy | `getByRole('button', { name: /Buy now/ })` on `/vouchers/amazon` |
| Quantity | buttons whose text is `−` and `+` |
| Checkout heading | `getByRole('heading', { name: 'Complete your purchase' })` |
| Demo wait copy | `Waiting for the demo confirm...` |
| Success heading | `getByRole('heading', { name: 'Payment successful' })` |
| Reveal codes | `getByRole('link', { name: 'View my voucher' })` (plural when qty > 1) |
| Admin login heading | `getByRole('heading', { name: 'Admin login' })` |
| Admin user | `input[autocomplete="username"]` |
| Admin pass | `input[autocomplete="current-password"]` |
| Admin submit | `getByRole('button', { name: 'Login' })` |
| Add stock | `getByRole('button', { name: '+ Add voucher' })` |

Do not use `scripts/demo-walkthrough.mjs` — it is gone. Do not treat `/redeem` as a form; it redirects to `/how-it-works`.

HTTP side effects (after a UI action, or to poll pay):

```bash
.cursor/skills/verify-vouchershop/scripts/control-vouchershop http GET /api/products
.cursor/skills/verify-vouchershop/scripts/control-vouchershop wait-paid --order-id '<id>'
```

Order ids look like `amazon.1.<epochMs>.<16 hex hmac>`, not a UUID.

Default credentials: `admin` / `admin123` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

## Evidence

Root: `/tmp/vouchershop-verify/evidence/<run-id>/`. Cleanup never deletes this tree.

Proof standards:

- Drive the real user path in the browser. `POST /api/orders` alone is not a catalog or checkout proof.
- Capture the action and the resulting screen (ARIA snapshot + screenshot). A final URL is not enough.
- Confirm side effects in JSON: pending orders have `voucherCodes: []`; paid orders have one code per quantity; demo `txHash` is `0x` + sha256(`demo:${orderId}`).
- Demo auto-pay skips the wallet. Prove the skip by watching checkout say you do not need to send USDC, then seeing pay without a tx from a wallet, then checking that `txHash` matches the demo digest — not by trusting the env name.
- `npm run verify:purchase` is a useful HTTP smoke (3× Amazon = 75 USDC, codes hidden until paid). It is not a mapped UI proof.

Minimum files for a feature proof:

- `*.aria.txt` — accessibility snapshot with AgentiX / the heading visible
- `*.png` — screenshot of the same state
- `*.json` — order or products payload when the feature mutates or lists stock

Record the feature file and entry point in the artifact names.

## Cleanup

```bash
.cursor/skills/verify-vouchershop/scripts/control-vouchershop cleanup
```

Kills only the PID in the state file (process group), then deletes the scratch app copy. Leaves `/tmp/vouchershop-verify/evidence/`. After `--in-place`, does not delete `data/vouchershop.json`.

Run cleanup after every failed iteration and after the last drive. Confirm evidence still exists at its named path.

## Isolate

Two Next processes that share a cwd share `data/vouchershop.json` and will corrupt each other's stock and orders. Isolated `launch` (the default) is the only supported way to run beside a human `:3000`.

If doctor did not start this instance, do not drive it unless the operator explicitly owns that URL and doctor still passes.

## Helpers

All helpers are executable. Invoke them from the repo root as shown.

```bash
.cursor/skills/verify-vouchershop/scripts/control-vouchershop launch [--port 4173] [--in-place] [--repo <abs>]
.cursor/skills/verify-vouchershop/scripts/control-vouchershop doctor [--url http://127.0.0.1:4173]
.cursor/skills/verify-vouchershop/scripts/control-vouchershop http GET /api/products [--out file]
.cursor/skills/verify-vouchershop/scripts/control-vouchershop http POST /api/admin/login '{"username":"admin","password":"admin123"}'
.cursor/skills/verify-vouchershop/scripts/control-vouchershop wait-paid --order-id '<id>'
.cursor/skills/verify-vouchershop/scripts/control-vouchershop save-html / [--out file]
.cursor/skills/verify-vouchershop/scripts/control-vouchershop cleanup
```

`launch` requires `node_modules` in `--repo` (run `npm install` first). It does not install.

On-chain purchase (`npm run test:e2e`) needs Anvil on `:8545` and `.env.local` pointed at that RPC. Treat it as `verified-unreachable` unless that prerequisite is up. It is not a feature-map entry.

## Feature map

`features/README.md` plus one file per feature. Drive from those recipes.
