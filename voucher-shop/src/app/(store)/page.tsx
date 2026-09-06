import Link from "next/link";
import { GiftCardArt } from "@/components/gift-card-art";
import { IconBolt, IconClock, IconShield } from "@/components/icons";
import { VoucherCard } from "@/components/voucher-card";
import { POPULAR_SLUGS } from "@/lib/catalog";
import { listProducts } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";

export default function HomePage() {
  const products = listProducts().map(toPublicProduct);
  const popular = products.filter((product) =>
    POPULAR_SLUGS.includes(product.slug as (typeof POPULAR_SLUGS)[number])
  );

  return (
    <div>
      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Buy Digital Vouchers with Stablecoin
            </h1>
            <p className="mt-4 max-w-lg text-slate-500">
              Fast, simple, and secure. Pay with USDC on Sepolia testnet and get your
              voucher instantly.
            </p>
            <Link
              href="/vouchers"
              className="mt-8 inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Browse vouchers
            </Link>
          </div>
          <div className="relative mx-auto h-64 w-full max-w-sm">
            <div className="absolute left-8 top-6 w-56 rotate-[-8deg] shadow-xl">
              <GiftCardArt theme="amazon" usdValue={25} className="h-36" />
            </div>
            <div className="absolute right-4 top-16 w-56 rotate-[10deg] shadow-xl">
              <GiftCardArt theme="netflix" usdValue={15} className="h-36" />
            </div>
            <div className="absolute bottom-0 left-16 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-white shadow-lg">
              $
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <IconBolt />
          <h2 className="mt-4 font-semibold">Pay with USDC</h2>
          <p className="mt-1 text-sm text-slate-500">Sepolia testnet stablecoin</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <IconClock />
          <h2 className="mt-4 font-semibold">Instant Delivery</h2>
          <p className="mt-1 text-sm text-slate-500">Codes after payment confirms</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <IconShield />
          <h2 className="mt-4 font-semibold">Trusted & Secure</h2>
          <p className="mt-1 text-sm text-slate-500">On-chain payment checks</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-bold text-slate-900">Popular Vouchers</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((product) => (
            <VoucherCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
