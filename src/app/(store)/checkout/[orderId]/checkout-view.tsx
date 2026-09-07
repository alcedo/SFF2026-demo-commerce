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
  const [current, setCurrent] = useState(order);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    setCurrent(order);
  }, [order]);

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
        if (!data.order) return;
        setCurrent(data.order);
        if (data.order.status === "paid") {
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
      router.push(`/vouchers/${current.product.slug}`);
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
          <GiftCardArt theme={current.product.theme} usdValue={current.product.usdValue} className="h-14" />
        </div>
        <div className="flex-1">
          <p className="font-black tracking-tight">{current.product.name}</p>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            {formatUsd(current.product.usdValue)} × {current.quantity}
          </p>
        </div>
        <p className="font-black text-green-hi">{current.amountLabel}</p>
      </div>

      <div className="mt-8">
        {current.status === "expired" ? (
          <p className="font-medium">This invoice is no longer collecting payment.</p>
        ) : PUBLIC_DEMO_AUTO_PAY ? (
          <>
            <p className="font-medium">
              This playground confirms the order in about eight seconds. You do not need to send USDC.
            </p>
            <p className="mt-4 text-sm text-muted">
              Optional. Send {current.amountLabel} on Sepolia to {current.merchantAddress}{" "}
              if you want to exercise the real rail. That address is only for this order.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">
              1. Send {current.amountLabel} to this order&apos;s address (Sepolia testnet)
            </p>
            <div className="panel mt-3 flex items-center gap-2 px-3 py-3 font-mono text-xs sm:text-sm">
              <span className="flex-1 break-all text-paper">{current.merchantAddress}</span>
              <CopyButton value={current.merchantAddress} />
            </div>
            <p className="mt-4 text-sm text-muted">
              This address stays reserved after expire so a late Transfer can still pay this invoice.
            </p>
            <p className="mt-6">2. We detect your payment automatically. This usually takes 10-30 seconds.</p>
          </>
        )}
      </div>

      {current.status === "expired" ? (
        <div className="panel mt-6 border-warning/30 px-4 py-3 text-sm text-warning">
          This invoice expired. The deposit address stays reserved so a late payment can still match.
        </div>
      ) : PUBLIC_DEMO_AUTO_PAY ? null : (
        <div className="panel mt-6 border-warning/30 px-4 py-3 text-sm text-warning">
          Send only USDC on Sepolia testnet. Other tokens will not be detected.
        </div>
      )}

      {current.status === "expired" ? null : (
        <div className="panel mt-6 flex items-center gap-3 px-4 py-5 text-sm text-muted">
          <Spinner />
          <span>
            {PUBLIC_DEMO_AUTO_PAY
              ? "Waiting for the demo confirm..."
              : "Waiting for payment... We confirm your payment automatically."}
          </span>
        </div>
      )}

      {current.status === "expired" ? (
        <Link href={`/vouchers/${current.product.slug}`} className="eyebrow mt-8 inline-block text-green-hi">
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
