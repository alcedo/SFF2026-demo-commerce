"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { GiftCardArt } from "@/components/gift-card-art";
import type { PublicOrder } from "@/lib/order-view";

export default function VoucherDisplayPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((res) => res.json())
      .then((data: { order?: PublicOrder }) => setOrder(data.order ?? null));
  }, [params.id]);

  if (!order) {
    return <div className="px-4 py-16 text-center text-slate-500">Loading...</div>;
  }

  const count = order.voucherCodes.length || order.quantity;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Your vouchers are ready! Here {count === 1 ? "is your voucher code" : `are your ${count} voucher codes`}.
        Copy each code and redeem on the respective platform.
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="w-16">
          <GiftCardArt theme={order.product.theme} usdValue={order.product.usdValue} className="h-12" />
        </div>
        <div>
          <p className="font-semibold">{order.product.name}</p>
          <p className="text-sm text-slate-500">
            ${order.product.usdValue} USD × {order.quantity}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {order.voucherCodes.map((code, index) => (
          <div key={code} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-4">
            <div>
              <p className="text-xs text-slate-500">Voucher #{index + 1}</p>
              <p className="mt-1 font-mono text-lg font-semibold tracking-wide">{code}</p>
            </div>
            <CopyButton value={code} className="text-slate-500" />
          </div>
        ))}
      </div>

      {order.voucherCodes.length === 1 ? (
        <CopyButton
          value={order.voucherCodes[0]}
          label="Copy Code"
          className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-brand font-semibold text-white"
        />
      ) : null}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-semibold text-slate-900">Redemption Instructions</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
            {order.product.redeemSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">Need Help?</h2>
          <p className="mt-3 text-sm text-slate-600">
            If a code does not work, contact support with your transaction hash.
          </p>
          <a
            href="mailto:support@vouchershop.example"
            className="mt-4 inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
