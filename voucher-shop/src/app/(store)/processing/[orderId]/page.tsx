"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconCheck, Spinner } from "@/components/icons";
import type { PublicOrder } from "@/lib/order-view";

const steps = [
  "Payment detected on blockchain",
  "Confirming transaction (1/3 confirmations)",
  "Processing order",
  "Preparing your voucher",
];

export default function ProcessingPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [done, setDone] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function waitForPaid() {
      const res = await fetch(`/api/orders/${params.orderId}`);
      const data = (await res.json()) as { order?: PublicOrder };
      if (!active) return;
      if (data.order?.status === "paid") {
        setReady(true);
        return;
      }
      window.setTimeout(waitForPaid, 1500);
    }
    waitForPaid();
    return () => {
      active = false;
    };
  }, [params.orderId]);

  useEffect(() => {
    if (!ready) return;
    if (done >= steps.length) {
      const timer = window.setTimeout(() => {
        router.replace(`/success/${params.orderId}`);
      }, 700);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setDone((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [ready, done, params.orderId, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <Spinner className="h-16 w-16" />
      <h1 className="mt-8 text-2xl font-bold text-slate-900">Detecting your payment...</h1>
      <ul className="mt-8 w-full space-y-3 text-left text-sm">
        {steps.map((label, index) => {
          const complete = index < done;
          const current = index === done && ready;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  complete ? "bg-success text-white" : "border border-slate-200 text-slate-400"
                }`}
              >
                {complete ? <IconCheck /> : current ? <Spinner className="h-4 w-4" /> : null}
              </span>
              <span className={complete ? "text-slate-800" : "text-slate-500"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
