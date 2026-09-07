import Link from "next/link";
import { GiftCardArt } from "@/components/gift-card-art";
import { formatUsdc, formatUsd, toMicroUsdc } from "@/lib/config";
import type { PublicProduct } from "@/lib/order-view";

export function VoucherCard({ product }: { product: PublicProduct }) {
  return (
    <article className="panel overflow-hidden">
      <GiftCardArt theme={product.theme} usdValue={product.usdValue} className="h-36 rounded-none" />
      <div className="p-4">
        <h3 className="text-lg font-black tracking-tight text-paper">{product.name}</h3>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-muted">
          {formatUsd(product.usdValue)}
        </p>
        <p className="mt-2 text-lg font-black text-green-hi">
          {formatUsdc(toMicroUsdc(product.priceUsdc))} USDC
        </p>
        <Link href={`/vouchers/${product.slug}`} className="btn btn-primary mt-4 h-10 w-full text-xs">
          Buy now
        </Link>
      </div>
    </article>
  );
}
