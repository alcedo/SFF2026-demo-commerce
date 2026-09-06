import Link from "next/link";
import { GiftCardArt } from "@/components/gift-card-art";
import type { PublicProduct } from "@/lib/order-view";

export function VoucherCard({ product }: { product: PublicProduct }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <GiftCardArt theme={product.theme} usdValue={product.usdValue} className="h-36 rounded-none" />
      <div className="p-4">
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        <p className="mt-1 text-sm text-slate-500">${product.usdValue} USD</p>
        <p className="mt-1 text-lg font-bold text-brand">{product.priceUsdc} USDC</p>
        <Link
          href={`/vouchers/${product.slug}`}
          className="mt-4 flex h-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Buy Now
        </Link>
      </div>
    </article>
  );
}
