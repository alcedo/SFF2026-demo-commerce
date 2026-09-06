import Link from "next/link";
import { notFound } from "next/navigation";
import { GiftCardArt } from "@/components/gift-card-art";
import { getProductBySlug } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";
import { BuyPanel } from "./buy-panel";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = getProductBySlug(slug);
  if (!record) notFound();
  const product = toPublicProduct(record);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/vouchers" className="text-sm text-brand hover:underline">
        ← Back to vouchers
      </Link>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <GiftCardArt theme={product.theme} usdValue={product.usdValue} className="min-h-[280px]" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
          <p className="mt-2 text-slate-500">${product.usdValue} USD</p>
          <p className="mt-1 text-2xl font-bold text-brand">{product.priceUsdc} USDC</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{product.description}</p>
          <div className="mt-8">
            <BuyPanel product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
