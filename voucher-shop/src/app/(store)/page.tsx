import Link from "next/link";
import { GiftCardArt } from "@/components/gift-card-art";
import { IconBolt, IconClock, IconShield } from "@/components/icons";
import { VoucherCard } from "@/components/voucher-card";
import { POPULAR_SLUGS } from "@/lib/catalog";
import { listProducts } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";

const tags = ["Developers", "AI Agents", "Stablecoins", "Programmable Payments"];

const features = [
  {
    n: "01",
    title: "Pay with USDC",
    body: "Sepolia testnet stablecoin on trusted rails.",
    icon: IconBolt,
  },
  {
    n: "02",
    title: "Instant delivery",
    body: "Codes unlock the moment payment confirms.",
    icon: IconClock,
  },
  {
    n: "03",
    title: "Trusted checks",
    body: "On-chain transfer verification before reveal.",
    icon: IconShield,
  },
];

export default function HomePage() {
  const products = listProducts().map(toPublicProduct);
  const popular = products.filter((product) =>
    POPULAR_SLUGS.includes(product.slug as (typeof POPULAR_SLUGS)[number])
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <p className="kicker">Singapore · 2026</p>
            <div className="mt-5 inline-flex items-center gap-2 tag">
              <span className="glow-dot" />
              First public activation
            </div>
            <h1 className="mt-6 text-4xl text-paper md:text-6xl">
              Buy digital vouchers
              <span className="block text-green-hi">with stablecoin.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted md:text-base">
              Fast, simple, and on-chain. Pay with USDC on Sepolia and receive
              voucher codes the moment the transfer confirms.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vouchers" className="btn btn-primary">
                Enter voucher rails
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost">
                How it works
              </Link>
            </div>
            <p className="eyebrow mt-8 text-faint">Powered by</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["StraitsX", "USDC", "Sepolia", "AgentiX rails"].map((item) => (
                <span key={item} className="tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="relative mx-auto h-72 w-full max-w-sm">
            <div className="absolute left-6 top-4 w-56 rotate-[-8deg] shadow-[0_0_40px_rgba(0,211,126,0.18)]">
              <GiftCardArt theme="amazon" usdValue={25} className="h-36" />
            </div>
            <div className="absolute right-2 top-16 w-56 rotate-[10deg] shadow-[0_0_40px_rgba(0,255,153,0.12)]">
              <GiftCardArt theme="netflix" usdValue={15} className="h-36" />
            </div>
            <div className="absolute bottom-2 left-14 flex h-16 w-16 items-center justify-center bg-green font-mono text-xl font-bold text-ink notch-md">
              $
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.n} className="panel p-6">
              <div className="flex items-center justify-between">
                <Icon />
                <span className="font-mono text-sm tracking-[0.2em] text-green">{feature.n}</span>
              </div>
              <h2 className="mt-5 text-2xl">{feature.title}</h2>
              <p className="mt-2 text-sm text-muted">{feature.body}</p>
            </div>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <p className="kicker">Catalog</p>
        <h2 className="mt-3 text-3xl md:text-4xl">Popular vouchers</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((product) => (
            <VoucherCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
