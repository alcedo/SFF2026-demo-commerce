"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type OrderView = {
  id: string;
  status: string;
  amountUsdc: number;
  voucherCode: string | null;
  txHash: string | null;
};

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch(`/api/orders?id=${params.id}`);
      const data = await res.json();
      if (!active) return;
      if (!res.ok) {
        setError(data.error ?? "Order not found");
        return;
      }
      setOrder(data.order);
    }

    load();
    const interval = setInterval(load, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [params.id]);

  async function copyCode() {
    if (!order?.voucherCode) return;
    await navigator.clipboard.writeText(order.voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-zinc-600">Loading order...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        Back to shop
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Your order</h1>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Order ID</p>
        <p className="font-mono text-sm">{order.id}</p>
        <p className="mt-4 text-sm text-zinc-500">Amount</p>
        <p className="text-lg font-semibold">{order.amountUsdc} USDC</p>
        <p className="mt-4 text-sm text-zinc-500">Status</p>
        <p className="font-medium capitalize">{order.status}</p>
      </div>

      {order.status === "paid" && order.voucherCode ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-semibold text-emerald-900">
            Your digital voucher
          </h2>
          <p className="mt-2 text-sm text-emerald-800">
            Copy this code and redeem it at partner stores.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-white px-4 py-3 text-lg font-mono font-bold tracking-wider text-emerald-900">
              {order.voucherCode}
            </code>
            <button
              onClick={copyCode}
              className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <Link
            href="/redeem"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Redeem this voucher
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-800">
            Waiting for payment confirmation on Sepolia...
          </p>
        </div>
      )}
    </div>
  );
}
