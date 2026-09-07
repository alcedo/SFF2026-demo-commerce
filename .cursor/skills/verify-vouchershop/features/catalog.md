# Browse the catalog

Catalog lets a user see popular gift cards on the home page, open the full list, narrow it by search or category, and open a product with its USDC price.

## Sub-features

- `catalog-home` shows the three popular cards (Amazon, Netflix, Steam) under `Popular vouchers`.
- `catalog-grid` lists every active brand on `/vouchers`.
- `catalog-search` filters cards by name or brand text.
- `catalog-category` keeps only one category.
- `catalog-product` opens a product page with price and a buy control.

## How to get to it (user POV)

- Open `/`.
- Choose `Enter voucher rails` on the home page.
- Choose `Vouchers` in the header.
- Choose `Buy now` on a home or catalog card.
- Open `/vouchers/<slug>` directly (Amazon is `/vouchers/amazon`).

## Driving it with control-vouchershop

Preconditions:

- Instance is healthy at `$URL` (`control-vouchershop doctor` exits 0).
- Demo auto-pay is on (`eight seconds` on home).
- Browser is on `$URL/`.

- **Home popular.** Read the home page. The heading is `Buy digital vouchers`. The region under `Popular vouchers` contains headings `Amazon Gift Card`, `Netflix Gift Card`, and `Steam Gift Card`, each with a `Buy now` link.
- **Nav entry.** Choose `Vouchers`. The heading is `All digital vouchers`. Cards include Amazon, Grab, and Shopee (nine brands).
- **CTA entry.** Return home and choose `Enter voucher rails`. The same `/vouchers` heading appears.
- **Search.** On `/vouchers`, fill the field whose placeholder is `Search vouchers...` with `netflix`. The grid shows `Netflix Gift Card` and does not show `Amazon Gift Card`.
- **Clear search.** Clear that field. Amazon returns.
- **Category.** Set the category `<select>` to `Gaming`. The grid includes `Steam Gift Card` and `Xbox Gift Card` and does not include `Amazon Gift Card`.
- **Reset category.** Set the `<select>` to `All Categories`. Amazon returns.
- **Product from card.** On the Amazon card, choose `Buy now`. The product heading is `Amazon Gift Card`, the price line is `0.025 USDC`, and a button matching `Buy now · 0.025 USDC` is enabled.
- **Product from URL.** Open `$URL/vouchers/steam`. The heading is `Steam Gift Card` and the button matches `Buy now · 0.02 USDC`.
- **HTTP list.** Run `control-vouchershop http GET /api/products --out $EVIDENCE/catalog/products.json`. The JSON includes `amazon` at `priceUsdc` 0.025 and `available` ≥ 1.
- **Proof.** On `/vouchers` with search empty and category `All Categories`, capture `$EVIDENCE/catalog/grid.aria.txt` and `$EVIDENCE/catalog/grid.png`. Both show AgentiX and `All digital vouchers` plus at least Amazon, Netflix, and Steam.

## Gotchas

- `Buy now` appears on every card. Scope it to the article whose heading is the product you mean, or you will open the wrong slug.
- Search matches `name` and `brand` only, client-side. A query like `25` does not filter by price.
- Category values are `Shopping`, `Streaming`, `Gaming`, `Apps`, `Delivery`. Anything else is ignored because the select only offers those plus `All Categories`.
- Home popular is a subset (`amazon`, `netflix`, `steam`). Proving home is not proving the full grid.
- Isolated launch seeds 12 available codes per product plus one used Amazon and one expired Netflix. `available` on Amazon is 12, not 13.
- Search is React-controlled. Setting `input.value` in JS (or a raw DOM wipe) leaves the filter on the old query while the field looks empty. Clear with the same fill/keystroke path you used to type (`fill('')` or select-all then delete).
- The home heading's accessible name is `Buy digital vouchers with stablecoin.` Match `/Buy digital vouchers/`. The brand link's name is `AgentiX Playground`.
