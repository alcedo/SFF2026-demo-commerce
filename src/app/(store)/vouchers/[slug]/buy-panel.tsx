"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBan, IconClock, IconGlobe } from "@/components/icons";
import { formatUsdc, toMicroUsdc } from "@/lib/config";
import type { PublicProduct } from "@/lib/order-view";

export function BuyPanel({ product }: { product: PublicProduct }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const max = Math.min(10, Math.max(1, product.available));
  const totalLabel = `${formatUsdc(toMicroUsdc(product.priceUsdc) * BigInt(quantity))} USDC`;

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
      <ul className="space-y-3 text-sm text-muted">
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
        <button type="button" onClick={() => bump(-1)} className="btn btn-ghost h-10 w-10 px-0">
          −
        </button>
        <span className="w-8 text-center text-lg font-black">{quantity}</span>
        <button type="button" onClick={() => bump(1)} className="btn btn-ghost h-10 w-10 px-0">
          +
        </button>
      </div>

      <div className="panel mt-4 flex items-center justify-between px-4 py-3 text-sm">
        <span className="eyebrow text-muted">Total</span>
        <span className="font-black text-green-hi">{totalLabel}</span>
      </div>

      <button
        type="button"
        onClick={buy}
        disabled={loading || product.available < 1}
        className="btn btn-primary mt-4 h-12 w-full"
      >
        {loading ? "Creating order..." : `Buy now · ${totalLabel}`}
      </button>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
