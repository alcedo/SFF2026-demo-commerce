"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { IconCheck } from "@/components/icons";
import { formatDateTime, NETWORK_NAME, truncateHex } from "@/lib/config";
import type { PublicOrder } from "@/lib/order-view";

export default function SuccessPage() {
  const params = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.orderId}`)
      .then((res) => res.json())
      .then((data: { order?: PublicOrder }) => setOrder(data.order ?? null));
  }, [params.orderId]);

  if (!order) {
    return <div className="px-4 py-16 text-center text-slate-500">Loading...</div>;
  }

  const voucherWord = order.quantity === 1 ? "voucher is" : "vouchers are";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success text-white">
        <IconCheck className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-slate-900">Payment Successful!</h1>
      <p className="mt-2 text-slate-500">Your {order.quantity} {voucherWord} ready.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href={`/order/${order.id}`}
          className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-semibold text-white"
        >
          {order.quantity === 1 ? "View My Voucher" : "View My Vouchers"}
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700"
        >
          Back to Home
        </Link>
      </div>
      <div className="mt-10 rounded-2xl bg-slate-50 p-5 text-left text-sm">
        <Row
          label="Transaction Hash"
          value={order.txHash ? truncateHex(order.txHash, 5, 4) : "—"}
          copy={order.txHash ?? undefined}
        />
        <Row label="Amount" value={`${order.amountUsdc.toFixed(2)} USDC`} />
        <Row label="Network" value={NETWORK_NAME} />
        <Row label="Date" value={formatDateTime(order.paidAt ?? order.createdAt)} />
        <div className="flex items-center justify-between py-2">
          <span className="text-slate-500">Status</span>
          <span className="inline-flex items-center gap-1 font-medium text-success">
            <IconCheck /> Confirmed (3/3)
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="inline-flex items-center gap-2 font-medium text-slate-800">
        {value}
        {copy ? <CopyButton value={copy} /> : null}
      </span>
    </div>
  );
}
