"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBan, IconClock, IconGlobe } from "@/components/icons";
import type { PublicProduct } from "@/lib/order-view";

export function BuyPanel({ product }: { product: PublicProduct }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const max = Math.min(10, Math.max(1, product.available));
  const total = product.priceUsdc * quantity;

  function bump(delta: number) {
    setQuantity((value) => Math.min(max, Math.max(1, value + delta)));
  }

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: product.slug, quantity }),
      });
      const data = (await res.json()) as { error?: string; order?: { id: string } };
      if (!res.ok || !data.order) throw new Error(data.error ?? "Could not create order");
      router.push(`/checkout/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create order");
      setLoading(false);
    }
  }

  return (
    <div>
      <ul className="space-y-3 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <IconClock /> Instant delivery
        </li>
        <li className="flex items-center gap-2">
          <IconGlobe /> Valid worldwide
        </li>
        <li className="flex items-center gap-2">
          <IconBan /> Non-refundable
        </li>
      </ul>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="h-10 w-10 rounded-lg border border-slate-200 text-lg"
        >
          −
        </button>
        <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
        <button
          type="button"
          onClick={() => bump(1)}
          className="h-10 w-10 rounded-lg border border-slate-200 text-lg"
        >
          +
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
        <span className="text-slate-500">Total</span>
        <span className="font-bold text-brand">{total} USDC</span>
      </div>

      <button
        type="button"
        onClick={buy}
        disabled={loading || product.available < 1}
        className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Creating order..." : `Buy Now (${total} USDC)`}
      </button>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
