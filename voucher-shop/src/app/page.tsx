import Link from "next/link";
import { listProducts } from "@/lib/db";
import { fromMicroUsdc } from "@/lib/config";

export default function HomePage() {
  const products = listProducts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Digital Gift Vouchers</h1>
        <p className="mt-2 max-w-2xl text-zinc-600">
          Pay with USDC on Sepolia testnet. After payment confirms, you receive a
          unique voucher code to copy and redeem.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {products.map((product) => (
          <article
            key={product.id}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="mt-2 text-sm text-zinc-600">{product.description}</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-2xl font-bold">
                {fromMicroUsdc(product.price_micro)} USDC
              </span>
              <Link
                href={`/checkout/${product.id}`}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Buy now
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
