# VoucherShop verification map

This directory is the maintained source for verifying the user-facing behavior of VoucherShop (AgentiX Playground). Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `.cursor/skills/verify-vouchershop/scripts/control-vouchershop launch` so the instance is isolated and demo auto-pay is on.
- Doctor that instance: `.cursor/skills/verify-vouchershop/scripts/control-vouchershop doctor`.
- Expected URL: `http://127.0.0.1:4173` unless `launch` printed another port.
- Home copy includes `eight seconds` and the header chip `Demo · Sepolia`.
- Seed catalog includes Amazon ($25 / 25 USDC), Netflix ($15), Steam ($20), plus six more brands. Each active product starts with 12 available codes.
- Admin login is `admin` / `admin123`.
- Never drive an instance that this run did not launch, unless the operator owns the URL and doctor passes.

## Driving conventions

- Start every recipe from the baseline home page unless its preconditions say otherwise.
- Prefer role + name, then placeholder / `autocomplete`. Scope `Buy now` to the card whose heading is the product name — the catalog has many.
- Treat every command as literal. Keep quoted names unchanged.
- Run browser actions against `$URL`. Run HTTP checks through `control-vouchershop http` / `wait-paid`.
- Purchases consume stock. Isolated launch starts from a fresh seed. Do not wipe `/tmp/vouchershop-verify/evidence/`.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with AgentiX visible.
- Mutation proof includes `GET /api/orders/<id>` (or the admin table) as a second view.
- Demo auto-pay is on for these recipes. A wallet transfer is out of scope here.
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted URL and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with control-vouchershop` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Browse the catalog](./catalog.md) covers home popular cards, the full grid, search, category filter, and a product page.
- [Buy with demo auto-pay](./demo-purchase.md) covers quantity, checkout, the eight-second confirm, receipt, and code reveal.
- [Redeem help](./redeem-help.md) covers How it works and the `/redeem` redirect.
- [Admin inventory](./admin-inventory.md) covers login, dashboard counts, adding a code, and filtering.
