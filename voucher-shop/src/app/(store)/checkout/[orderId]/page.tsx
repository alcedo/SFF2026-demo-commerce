"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { GiftCardArt } from "@/components/gift-card-art";
import { Spinner } from "@/components/icons";
import type { PublicOrder } from "@/lib/order-view";

export default function CheckoutPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch(`/api/orders/${params.orderId}`);
      const data = (await res.json()) as { order?: PublicOrder; error?: string };
      if (!active) return;
      if (!res.ok || !data.order) {
        setError(data.error ?? "Order not found");
        return;
      }
      setOrder(data.order);
      if (data.order.status === "paid") {
        router.replace(`/processing/${data.order.id}`);
      }
    }
    load();
    const timer = window.setInterval(load, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [params.orderId, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-danger">{error}</div>
    );
  }
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-slate-500">Loading order...</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-slate-900">Complete Your Purchase</h1>

      <div className="mt-8 flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="w-20">
          <GiftCardArt theme={order.product.theme} usdValue={order.product.usdValue} className="h-14" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{order.product.name}</p>
          <p className="text-sm text-slate-500">
            ${order.product.usdValue} USD × {order.quantity}
          </p>
        </div>
        <p className="font-bold text-brand">{order.amountUsdc} USDC</p>
      </div>

      <div className="mt-8">
        <p className="font-medium text-slate-800">
          1. Send {order.amountUsdc.toFixed(2)} USDC to the address below (Use Sepolia testnet)
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 font-mono text-xs sm:text-sm">
          <span className="flex-1 break-all text-slate-700">{order.merchantAddress}</span>
          <CopyButton value={order.merchantAddress} className="text-slate-500" />
        </div>
        <p className="mt-6 text-slate-800">
          2. We detect your payment automatically. This usually takes 10-30 seconds.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Send only USDC on Sepolia testnet. Other tokens will not be detected.
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-5 text-sm text-slate-700">
        <Spinner />
        <span>Waiting for payment... We confirm your payment automatically.</span>
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <Link href={`/vouchers/${order.product.slug}`} className="mt-8 inline-block text-sm text-brand">
        ← Cancel and go back
      </Link>
    </div>
  );
}
