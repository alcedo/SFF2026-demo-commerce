# Admin inventory

Admin inventory lets a signed-in operator see stock counts, add codes, filter the table, and open one voucher's usage row.

## Sub-features

- `admin-login` accepts the configured username and password and rejects a wrong password.
- `admin-dashboard` shows Total / Available / Used / Expired plus recent activity.
- `admin-add` appends one or more codes to a product.
- `admin-filter` narrows the manage-vouchers table.
- `admin-usage` opens a single voucher from Usage History.
- `admin-logout` returns to the login screen.

## How to get to it (user POV)

- Open `/admin` or `/admin/login`.
- After login, use the sidebar: `Dashboard`, `Vouchers`, `Usage History`, `Settings`.
- Choose `+ Add voucher` on Manage vouchers.
- Choose `View` on a table row.

## Driving it with control-vouchershop

Preconditions:

- Instance is healthy at `$URL`.
- Credentials are `admin` / `admin123` unless `.env.local` overrides them.
- Browser is on `$URL/admin/login`.
- Choose a unique add-code such as `VERIFY-<run-id>-AMZ`.

- **Gate.** `/admin` without a session redirects to `/admin/login`. Heading is `Admin login`.
- **Bad password.** Fill `input[autocomplete="username"]` with `admin` and `input[autocomplete="current-password"]` with `wrong`. Choose `Login`. A `Invalid username or password` error stays on the login page.
- **Good login.** Fill username `admin`, password `admin123`. Choose `Login`. The heading is `Dashboard`. Cards `Total Vouchers`, `Available`, `Used`, and `Expired` are visible. Used is at least 1 (seeded Amazon used code). Expired is at least 1 (seeded Netflix expired code).
- **Settings.** Choose `Settings`. `Demo auto-detect` is `On`. `Admin username` is `admin`. `Network` is `Sepolia`.
- **Add stock.** Choose `Vouchers`. Heading is `Manage vouchers`. Choose `+ Add voucher`. In the dialog heading `Add voucher`, keep product `Amazon Gift Card (0.025 USDC)`, type `VERIFY-<run-id>-AMZ` into `Codes (one per line)`, choose `Add`. The page shows `Added 1 voucher(s).` and the table contains that code with status `available`.
- **Filter.** Set status to `available`, type `VERIFY-<run-id>-AMZ` into `Search codes`, choose `Filter`. The table includes that code and does not include the seeded `used` Amazon code.
- **Usage.** Choose `Usage History`. Choose `View` on the `VERIFY-<run-id>-AMZ` row. Heading is `Voucher usage`. Status is `available`.
- **Logout.** Choose `Logout`. The login heading returns. `/admin` redirects to login again.
- **Proof.** After a successful add, capture `$EVIDENCE/admin-inventory/vouchers.aria.txt` and `$EVIDENCE/admin-inventory/vouchers.png` on `/admin/vouchers?q=VERIFY-<run-id>-AMZ`. Both show `Manage vouchers` and the unique code.

## Gotchas

- Username and password labels are not `htmlFor`-linked. `getByLabel('Username')` is unreliable. Use the `autocomplete` attributes.
- `/admin/login` has no storefront header. Brand text is still `AgentiX` / `Admin` after login, in the sidebar.
- Duplicate codes error with `Code already exists: …`. Always use a unique `VERIFY-` prefix.
- Adding stock without an isolated launch writes the repo `data/vouchershop.json`. Prefer default `launch`.
- Dashboard counts include reserved/sold in Total but the four big numbers are total / available / used / expired only.
- Settings are read-only. Changing `.env.local` requires a restart; this recipe does not edit env.
