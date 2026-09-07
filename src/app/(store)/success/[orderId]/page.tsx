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
    return <div className="px-4 py-16 text-center text-muted">Loading...</div>;
  }

  const voucherWord = order.quantity === 1 ? "voucher is" : "vouchers are";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center bg-green text-ink notch">
        <IconCheck className="h-10 w-10" />
      </div>
      <p className="kicker mt-6">Confirmed</p>
      <h1 className="mt-3 text-4xl">Payment successful</h1>
      <p className="mt-3 text-muted">
        Your {order.quantity} {voucherWord} ready.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/order/${order.id}`} className="btn btn-primary">
          {order.quantity === 1 ? "View my voucher" : "View my vouchers"}
        </Link>
        <Link href="/" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
      <div className="panel mt-10 p-5 text-left text-sm">
        <Row
          label="Transaction Hash"
          value={order.txHash ? truncateHex(order.txHash, 5, 4) : "—"}
          copy={order.txHash ?? undefined}
        />
        <Row label="Amount" value={`${order.amountUsdc.toFixed(2)} USDC`} />
        <Row label="Network" value={NETWORK_NAME} />
        <Row label="Date" value={formatDateTime(order.paidAt ?? order.createdAt)} />
        <div className="flex items-center justify-between py-2">
          <span className="eyebrow text-muted">Status</span>
          <span className="inline-flex items-center gap-1 font-medium text-green-hi">
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
    <div className="flex items-center justify-between border-b border-line-soft py-2">
      <span className="eyebrow text-muted">{label}</span>
      <span className="inline-flex items-center gap-2 font-medium text-paper">
        {value}
        {copy ? <CopyButton value={copy} /> : null}
      </span>
    </div>
  );
}
