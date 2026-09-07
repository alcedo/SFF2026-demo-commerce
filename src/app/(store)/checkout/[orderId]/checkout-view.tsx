"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { GiftCardArt } from "@/components/gift-card-art";
import { Spinner } from "@/components/icons";
import { formatUsd } from "@/lib/config";
import { PUBLIC_DEMO_AUTO_PAY } from "@/lib/public-flags";
import type { PublicOrder } from "@/lib/order-view";

export function CheckoutView({ order }: { order: PublicOrder }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    let inflight = false;
    async function poll() {
      if (inflight) return;
      inflight = true;
      try {
        const res = await fetch(`/api/orders/${order.id}`, {
          method: "POST",
          signal: AbortSignal.timeout(12_000),
        });
        const data = (await res.json()) as { order?: PublicOrder };
        if (!active) return;
        if (data.order?.status === "paid") {
          router.replace(`/processing/${data.order.id}`);
        }
      } catch {
        return;
      } finally {
        inflight = false;
      }
    }
    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [order.id, router]);

  async function cancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
      router.push(`/vouchers/${order.product.slug}`);
    } catch {
      setCancelling(false);
    }
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
            {formatUsd(order.product.usdValue)} × {order.quantity}
          </p>
        </div>
        <p className="font-black text-green-hi">{order.amountLabel}</p>
      </div>

      <div className="mt-8">
        {order.status === "expired" ? (
          <p className="font-medium">This invoice is no longer collecting payment.</p>
        ) : PUBLIC_DEMO_AUTO_PAY ? (
          <>
            <p className="font-medium">
              This playground confirms the order in about eight seconds. You do not need to send USDC.
            </p>
            <p className="mt-4 text-sm text-muted">
              Optional. Send {order.amountLabel} on Sepolia to {order.merchantAddress}{" "}
              if you want to exercise the real rail. That address is only for this order.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">
              1. Send {order.amountLabel} to this order&apos;s address (Sepolia testnet)
            </p>
            <div className="panel mt-3 flex items-center gap-2 px-3 py-3 font-mono text-xs sm:text-sm">
              <span className="flex-1 break-all text-paper">{order.merchantAddress}</span>
              <CopyButton value={order.merchantAddress} />
            </div>
            <p className="mt-4 text-sm text-muted">
              This address is reserved for this invoice. Cancel or let it expire and the
              shop can reuse the address. A completed payment keeps the address consumed.
            </p>
            <p className="mt-6">2. We detect your payment automatically. This usually takes 10-30 seconds.</p>
          </>
        )}
      </div>

      {order.status === "expired" ? (
        <div className="panel mt-6 border-warning/30 px-4 py-3 text-sm text-warning">
          This invoice expired. The deposit address can be reused for a later order.
        </div>
      ) : PUBLIC_DEMO_AUTO_PAY ? null : (
        <div className="panel mt-6 border-warning/30 px-4 py-3 text-sm text-warning">
          Send only USDC on Sepolia testnet. Other tokens will not be detected.
        </div>
      )}

      {order.status === "expired" ? null : (
        <div className="panel mt-6 flex items-center gap-3 px-4 py-5 text-sm text-muted">
          <Spinner />
          <span>
            {PUBLIC_DEMO_AUTO_PAY
              ? "Waiting for the demo confirm..."
              : "Waiting for payment... We confirm your payment automatically."}
          </span>
        </div>
      )}

      {order.status === "expired" ? (
        <Link href={`/vouchers/${order.product.slug}`} className="eyebrow mt-8 inline-block text-green-hi">
          ← Buy again
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void cancel()}
          disabled={cancelling}
          className="eyebrow mt-8 text-green-hi"
        >
          {cancelling ? "Cancelling..." : "← Cancel and go back"}
        </button>
      )}
    </div>
  );
}
