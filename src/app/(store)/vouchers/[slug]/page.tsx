import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftCardArt } from "@/components/gift-card-art";
import { formatUsdc, formatUsd, toMicroUsdc } from "@/lib/config";
import { getProductBySlug } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";
import { BuyPanel } from "./buy-panel";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getProductBySlug(slug);
  if (!record) notFound();
  const product = await toPublicProduct(record);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/vouchers" className="eyebrow text-green-hi hover:text-paper">
        ← Back to vouchers
      </Link>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <GiftCardArt theme={product.theme} usdValue={product.usdValue} className="min-h-[280px]" />
        <div>
          <p className="kicker">{product.category}</p>
          <h1 className="mt-3 text-4xl">{product.name}</h1>
          <p className="mt-3 font-mono text-sm uppercase tracking-[0.16em] text-muted">
            {formatUsd(product.usdValue)}
          </p>
          <p className="mt-2 text-2xl font-black text-green-hi">
            {formatUsdc(toMicroUsdc(product.priceUsdc))} USDC
          </p>
          <p className="mt-4 text-sm leading-6 text-muted">{product.description}</p>
          <div className="mt-8">
            <BuyPanel product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
