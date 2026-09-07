# Buy with demo auto-pay

Demo purchase lets a user pick a quantity, start checkout, wait for the playground to confirm without sending USDC, and then read the voucher codes on the order page.

## Sub-features

- `buy-quantity` changes quantity on the product page and updates the total.
- `buy-create` starts a pending order and lands on checkout.
- `buy-demo-wait` shows the no-wallet copy and waits for the demo confirm.
- `buy-receipt` shows `Payment successful` and the demo transaction hash.
- `buy-reveal` shows one code per quantity only after the order is paid.

## How to get to it (user POV)

- Choose `Buy now` on a catalog or home card, then `Buy now · <n> USDC`.
- Open `/vouchers/<slug>`, set quantity, then buy.
- After pay, choose `View my voucher` (or `View my vouchers`) on the success page.
- Open `/order/<orderId>` while the order is still pending — codes stay hidden.

## Driving it with control-vouchershop

Preconditions:

- Instance is healthy at `$URL` and demo auto-pay is on.
- Amazon still has at least 1 available code (`control-vouchershop http GET /api/products`).
- Browser is on `$URL/vouchers/amazon`.

- **Quantity.** Choose `+` once. The total panel shows `0.05 USDC` and the buy button reads `Buy now · 0.05 USDC`. Choose `−` once. The total returns to `0.025 USDC`.
- **Create order.** Choose `Buy now · 0.025 USDC`. The button may read `Creating order...`. The next heading is `Complete your purchase`. The URL is `/checkout/<orderId>` where `<orderId>` matches `amazon.1.<digits>.<hex>`.
- **Pending leak check.** Before eight seconds pass, run `control-vouchershop http GET /api/orders/<orderId> --out $EVIDENCE/demo-purchase/pending.json`. `status` is `pending` and `voucherCodes` is `[]`.
- **Demo copy.** Checkout says `This playground confirms the order in about eight seconds. You do not need to send USDC.` and `Waiting for the demo confirm...`. Do not send a token.
- **Auto confirm.** Stay on checkout. The page reloads every 2.5s and the server confirms demo pay after about eight seconds. Then `/processing/<orderId>` (`Detecting your payment...`) and `/success/<orderId>`.
- **Receipt.** Success heading is `Payment successful`. Status text includes `Confirmed (3/3)`. Transaction Hash is a truncated `0x…` value. Amount is `0.025 USDC`. Network is `Sepolia`.
- **Demo digest.** On the paid JSON, `txHash` equals `0x` plus sha256 of the ascii string `demo:<orderId>` (hex). That is the skip: no wallet broadcast.
- **Reveal.** Choose `View my voucher`. The banner reads `Your vouchers are ready.` and a row `Voucher #1` shows a `XXXX-XXXX-XXXX-XXXX` code. `GET /api/orders/<orderId>` now has `status: "paid"` and `voucherCodes.length === 1`.
- **Hidden until paid.** In a second browser (or after cleanup + new launch), open `/order/<freshPendingId>` before eight seconds. The banner is `Payment is still pending. Codes stay hidden until the order is paid.` and no `Voucher #1` row exists.
- **Proof.** On the paid `/order/<orderId>` page, capture `$EVIDENCE/demo-purchase/order.aria.txt` and `$EVIDENCE/demo-purchase/order.png`, plus the paid JSON. Artifacts show AgentiX, `Your vouchers are ready`, and the code. JSON `txHash` matches the demo digest.

## Gotchas

- Default delay is 8000 ms (`DEMO_AUTO_PAY_MS`). Waiting 2–3 seconds and declaring failure is a false negative.
- Checkout uses `NEXT_PUBLIC_DEMO_AUTO_PAY` for the no-wallet copy. Server fulfill uses `DEMO_AUTO_PAY` / `NEXT_PUBLIC_DEMO_AUTO_PAY`. Isolated launch sets both to `1`. A hand-started app with only one of them set will lie on one side.
- Processing is a timed animation after pay. Do not treat `Detecting your payment...` as unpaid.
- Quantity max is `min(10, available)`. An empty SKU disables buy.
- `npm run verify:purchase` buys qty 3 over HTTP (0.075 USDC). That is not this recipe and it does not prove the buttons.
- Success `View my voucher` vs `View my vouchers` depends on quantity.
- Order ids are signed `slug.qty.timestamp.hmac`. A UUID 404s.
