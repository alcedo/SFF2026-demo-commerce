# Buy with demo auto-pay

Demo purchase lets a user pick a quantity, start checkout, cancel a pending invoice, wait for the playground to confirm without sending USDC, and then read the voucher codes on the order page.

## Sub-features

- `buy-quantity` changes quantity on the product page and updates the total.
- `buy-create` starts a pending order and lands on checkout.
- `buy-cancel` abandons a pending invoice and returns to the product page.
- `buy-demo-wait` shows the no-wallet copy and waits for the demo confirm.
- `buy-receipt` shows `Payment successful` and the demo transaction hash.
- `buy-reveal` shows one code per quantity only after the order is paid.

## How to get to it (user POV)

- Choose `Buy now` on a catalog or home card, then `Buy now · <n> USDC`.
- Open `/vouchers/<slug>`, set quantity, then buy.
- On checkout, choose `← Cancel and go back` to abandon a pending invoice.
- After pay, choose `View my voucher` (or `View my vouchers`) on the success page.
- Open `/order/<orderId>` while the order is still pending — codes stay hidden.

## Driving it with control-vouchershop

Preconditions:

- Instance is healthy at `$URL` and demo auto-pay is on.
- Amazon still has at least 1 available code (`control-vouchershop http GET /api/products`).
- Browser is on `$URL/vouchers/amazon`.

- **Quantity.** Choose `+` once. The total panel shows `0.05 USDC` and the buy button reads `Buy now · 0.05 USDC`. Choose `−` once. The total returns to `0.025 USDC`.
- **Cancel.** Choose `Buy now · 0.025 USDC`. The next heading is `Complete your purchase`. Before eight seconds pass, choose `← Cancel and go back`. The browser lands on `/vouchers/amazon`. `GET /api/orders/<orderId>` is `status: "expired"` and `voucherCodes` is `[]`.
- **Create order.** Choose `Buy now · 0.025 USDC` again. The button may read `Creating order...`. The next heading is `Complete your purchase`. The URL is `/checkout/<orderId>` where `<orderId>` matches `amazon.1.<digits>.<index>.<hex>` (five dotted parts: slug, qty, epoch ms, derivation index, hmac).
- **Pending leak check.** In the same turn as landing on checkout — before eight seconds pass — run `control-vouchershop http GET /api/orders/<orderId> --out $EVIDENCE/demo-purchase/pending.json`. `status` is `pending` and `voucherCodes` is `[]`. Waiting to read the page first will miss this window.
- **Demo copy.** Checkout says `This playground confirms the order in about eight seconds. You do not need to send USDC.` and `Waiting for the demo confirm...`. An optional Sepolia address still appears; that does not mean you left demo mode. Do not send a token.
- **Auto confirm.** Stay on checkout (it polls every 2s) or run `control-vouchershop wait-paid --order-id '<orderId>'`. After about eight seconds the app moves to `/processing/<orderId>` (`Detecting your payment...`) and then `/success/<orderId>`.
- **Receipt.** Success heading is `Payment successful`. Status text includes `Confirmed (3/3)`. Transaction Hash is a truncated `0x…` value. Amount is `0.025 USDC`. Network is `Sepolia`.
- **Demo digest.** `control-vouchershop demo-digest --order-id '<orderId>'` prints the expected hash. On the paid JSON, `txHash` equals that value (`0x` plus sha256 of the ascii string `demo:<orderId>`). That is the skip: no wallet broadcast.
- **Reveal.** Choose `View my voucher`. The banner reads `Your vouchers are ready.` and a row `Voucher #1` shows a `XXXX-XXXX-XXXX-XXXX` code. `GET /api/orders/<orderId>` now has `status: "paid"` and `voucherCodes.length === 1`.
- **Hidden until paid.** Immediately after create (same browser is enough), open `/order/<freshPendingId>` before eight seconds. The banner is `Payment is still pending. Codes stay hidden until the order is paid.` and no `Voucher #1` row exists.
- **Proof.** On the paid `/order/<orderId>` page, capture `$EVIDENCE/demo-purchase/order.aria.txt` and `$EVIDENCE/demo-purchase/order.png`, plus the paid JSON. Artifacts show AgentiX, `Your vouchers are ready`, and the code. JSON `txHash` matches the demo digest.

## Gotchas

- Default delay is 8000 ms (`DEMO_AUTO_PAY_MS`). Waiting 2–3 seconds and declaring failure is a false negative.
- Checkout uses `NEXT_PUBLIC_DEMO_AUTO_PAY` for the no-wallet copy. Server fulfill uses `DEMO_AUTO_PAY` / `NEXT_PUBLIC_DEMO_AUTO_PAY`. Isolated launch sets both to `1`. A hand-started app with only one of them set will lie on one side.
- Processing is a timed animation after pay. Do not treat `Detecting your payment...` as unpaid.
- Quantity max is `min(10, available)`. An empty SKU disables buy.
- `npm run verify:purchase` buys qty 3 over HTTP (0.075 USDC). That is not this recipe and it does not prove the buttons. `npm run verify:concurrent` fires three qty-1 orders at once and checks distinct deposit addresses. That is also not this recipe.
- Success `View my voucher` vs `View my vouchers` depends on quantity.
- Order ids are signed `slug.qty.timestamp.derivationIndex.hmac` (five parts). A four-part id or a UUID 404s.
- `← Cancel and go back` expires a pending invoice. After auto-pay it returns 409 `Order already paid` — cancel in the same turn as checkout, not after reading the page.
- Demo checkout still shows an optional deposit address. That is not live mode; the header chip stays `Demo · Sepolia`.
