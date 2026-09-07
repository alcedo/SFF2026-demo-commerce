# Buy with live Sepolia USDC

Live purchase lets a user start checkout on a deployed shop that has demo auto-pay off, send the catalog USDC amount to that invoice's Sepolia address, and read the voucher codes only after the transfer confirms.

## Sub-features

- `live-header` shows `Live · Sepolia` and no eight-second demo copy.
- `live-hold` keeps a new Amazon order `pending` with empty codes past eight seconds.
- `live-pay` records a real USDC `Transfer` to the invoice address.
- `live-receipt` shows `Payment successful` and a transaction hash that is not the demo digest.
- `live-reveal` shows one code per quantity on `/order/<orderId>`.

## How to get to it (user POV)

- Open the Vercel Preview URL with a share token if Deployment Protection is on.
- Choose `Buy now` on the Amazon card, then `Buy now · 0.025 USDC`.
- Send USDC on Sepolia to the address on checkout.
- After pay, choose `View my voucher` on the success page.

## Driving it with control-vouchershop

Preconditions:

- The operator owns `$URL` (a Vercel Preview, not isolated `launch`). Doctor that URL.
- Header chip is `Live · Sepolia`. Home does not contain `eight seconds`.
- `GET $URL/api/health/db` has `demoAutoPay: false`, `store: "neon"`, and `merchantKey: true`.
- Amazon `available` is at least 1.
- Buyer `0xE432A39eA2303dD8DD71C4afEc65AFa904AfB6Cb` has Sepolia ETH and USDC.
- Browser is on `$URL/vouchers/amazon`.

- **Create order.** Choose `Buy now · 0.025 USDC`. The next heading is `Complete your purchase`. Checkout says `Send 0.025 USDC to this order's address` and does not say `You do not need to send USDC`.
- **Hold.** Wait 12 seconds on checkout. Status stays pending. Heading is still `Complete your purchase`.
- **Pay.** From the repo, run `APP_URL=$URL npm run test:live` after creating the order, or send the invoice amount of Sepolia USDC to `merchantAddress` and keep the checkout tab open. Checkout HTML is a database read. Detection is `POST /api/orders/<id>` every 4s with a 12s abort. Do not use `GET /api/orders` behind a share link. That GET 302s to SSO.
- **Receipt.** Success heading is `Payment successful`. Amount is `0.025 USDC`. Network is `Sepolia`. Transaction hash is not `0x` plus sha256 of `demo:<orderId>`.
- **Reveal.** Choose `View my voucher`. Banner reads `Your vouchers are ready.` JSON `txHash` matches the on-chain USDC transfer.
- **Proof.** Capture `$EVIDENCE/live-purchase/order.aria.txt` and `$EVIDENCE/live-purchase/order.png`, plus the paid JSON. Artifacts show AgentiX and the code. `npm run test:live` writes the same tx and asserts deposit `balanceOf` rose by the invoice.

## Gotchas

- `NEXT_PUBLIC_DEMO_AUTO_PAY` is baked at build. Setting it to `0` without a new Preview still shows `Demo · Sepolia`.
- Isolated `launch` turns demo auto-pay on. Do not run this recipe against `http://127.0.0.1:4173`.
- Preview APIs sit behind Vercel Authentication. A share link sets `_vercel_jwt` for document navigations and for POST. Client `GET /api/orders` still 302s to SSO. Open HTML routes with the share cookie. Poll pay with POST.
- Public Sepolia RPC can stall from Vercel. Detect races publicnode, 1rpc, and Tenderly with a 4s abort each. Verify reads Transfer logs off `eth_getTransactionReceipt`, not a second `getLogs`. `POST /api/orders/<id>/verify` with the tx hash is the fallback the live script uses first.
- Quantity 1 Amazon costs 0.025 USDC. A dry buyer address fails the script before it broadcasts.
