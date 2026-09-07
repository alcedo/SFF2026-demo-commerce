# Redeem help

Redeem help tells a user how to take a paid code to the brand site. There is no in-app redeem form.

## Sub-features

- `redeem-nav` opens How it works from the header.
- `redeem-home` opens How it works from the home ghost button.
- `redeem-steps` shows the four redeem steps.
- `redeem-legacy` sends `/redeem` to How it works.

## How to get to it (user POV)

- Choose `How it works` in the header.
- Choose `How it works` on the home page (ghost button next to `Enter voucher rails`).
- Open `/how-it-works`.
- Open `/redeem` (old bookmark).

## Driving it with control-vouchershop

Preconditions:

- Instance is healthy at `$URL`.
- Browser is on `$URL/`.

- **Header entry.** Choose `How it works`. The heading is `How to redeem`. The kicker is `Define district`.
- **Home entry.** Return home. Choose the ghost `How it works` button (not the header link). The same heading appears.
- **Steps.** The numbered list contains exactly: `Complete your purchase with USDC on Sepolia.`; `Copy the voucher code from the success page.`; `Open the brand redeem page and sign in.`; `Paste the code. The balance is added to your account.`
- **Help.** A `Need help?` panel includes `Contact support` pointing at `mailto:support@vouchershop.example`.
- **Legacy URL.** Open `$URL/redeem`. The browser ends on `/how-it-works` with the same heading. There is no code field and no Redeem submit control.
- **Proof.** Capture `$EVIDENCE/redeem-help/how.aria.txt` and `$EVIDENCE/redeem-help/how.png` on `/how-it-works`. Both show AgentiX, `How to redeem`, and step `01`.

## Gotchas

- `/redeem` is a redirect, not a form. A recipe that types into `input` on `/redeem` is stale.
- This page does not mark a voucher `used`. `POST /api/vouchers/redeem` exists for scripts; it is not a user entry point here.
- Product pages also list brand-specific redeem steps after pay. That copy lives on `/order/<id>`, not this page.
