"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, Spinner } from "@/components/icons";

const steps = [
  "Payment detected on blockchain",
  "Confirming transaction (1/3 confirmations)",
  "Processing order",
  "Preparing your voucher",
];

export function ProcessingView({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (done >= steps.length) {
      const timer = window.setTimeout(() => {
        router.replace(`/success/${orderId}`);
      }, 700);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setDone((value) => value + 1), 900);
    return () => window.clearTimeout(timer);
  }, [done, orderId, router]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <Spinner className="h-16 w-16" />
      <p className="kicker mt-8">Validation</p>
      <h1 className="mt-3 text-3xl">Detecting your payment...</h1>
      <ul className="mt-8 w-full space-y-3 text-left text-sm">
        {steps.map((label, index) => {
          const complete = index < done;
          const current = index === done;
          return (
            <li key={label} className="panel flex items-center gap-3 px-3 py-3">
              <span
                className={`flex h-6 w-6 items-center justify-center notch-sm ${
                  complete ? "bg-green text-ink" : "border border-line text-faint"
                }`}
              >
                {complete ? <IconCheck className="h-4 w-4" /> : current ? <Spinner className="h-4 w-4" /> : null}
              </span>
              <span className={complete ? "text-paper" : "text-muted"}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
