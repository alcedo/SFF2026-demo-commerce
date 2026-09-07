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
    return <div className="mx-auto max-w-2xl px-4 py-16 text-danger">{error}</div>;
  }
  if (!order) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-muted">Loading order...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="kicker text-center">Rails</p>
      <h1 className="mt-3 text-center text-4xl">Complete your purchase</h1>

      <div className="panel mt-8 flex items-center gap-4 p-4">
        <div className="w-20">
          <GiftCardArt theme={order.product.theme} usdValue={order.product.usdValue} className="h-14" />
        </div>
        <div className="flex-1">
          <p className="font-black tracking-tight">{order.product.name}</p>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            ${order.product.usdValue} USD × {order.quantity}
          </p>
        </div>
        <p className="font-black text-green-hi">{order.amountUsdc} USDC</p>
      </div>

      <div className="mt-8">
        <p className="font-medium">
          1. Send {order.amountLabel} to the address below (Use Sepolia testnet)
        </p>
        <div className="panel mt-3 flex items-center gap-2 px-3 py-3 font-mono text-xs sm:text-sm">
          <span className="flex-1 break-all text-paper">{order.merchantAddress}</span>
          <CopyButton value={order.merchantAddress} />
        </div>
        <p className="mt-6">2. We detect your payment automatically. This usually takes 10-30 seconds.</p>
      </div>

      <div className="panel mt-6 border-warning/30 px-4 py-3 text-sm text-warning">
        Send only USDC on Sepolia testnet. Other tokens will not be detected.
      </div>

      <div className="panel mt-6 flex items-center gap-3 px-4 py-5 text-sm text-muted">
        <Spinner />
        <span>Waiting for payment... We confirm your payment automatically.</span>
      </div>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <Link href={`/vouchers/${order.product.slug}`} className="eyebrow mt-8 inline-block text-green-hi">
        ← Cancel and go back
      </Link>
    </div>
  );
}
