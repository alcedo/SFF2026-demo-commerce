import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { GiftCardArt } from "@/components/gift-card-art";
import { formatUsd } from "@/lib/config";
import { loadPublicOrder } from "@/lib/order-view";

export default async function VoucherDisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await loadPublicOrder(id);
  if (!order) notFound();

  const ready = order.status === "paid" && order.voucherCodes.length > 0;
  const count = order.voucherCodes.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div
        className={
          ready
            ? "panel border-green/40 bg-[rgba(0,255,153,0.08)] px-4 py-3 text-sm text-green-hi"
            : "panel px-4 py-3 text-sm text-muted"
        }
      >
        {ready
          ? `Your vouchers are ready. Here ${count === 1 ? "is your voucher code" : `are your ${count} voucher codes`}. Copy each code and redeem on the brand site.`
          : "Payment is still pending. Codes stay hidden until the order is paid."}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="w-16">
          <GiftCardArt theme={order.product.theme} usdValue={order.product.usdValue} className="h-12" />
        </div>
        <div>
          <p className="font-black tracking-tight">{order.product.name}</p>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            {formatUsd(order.product.usdValue)} × {order.quantity}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {order.voucherCodes.map((code, index) => (
          <div key={code} className="panel flex items-center justify-between px-4 py-4">
            <div>
              <p className="eyebrow text-muted">Voucher #{index + 1}</p>
              <p className="mt-1 font-mono text-lg font-semibold tracking-wide text-green-hi">{code}</p>
            </div>
            <CopyButton value={code} />
          </div>
        ))}
      </div>

      {order.voucherCodes.length === 1 ? (
        <CopyButton value={order.voucherCodes[0]} label="Copy code" className="btn btn-primary mt-6 h-12 w-full" />
      ) : null}

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-2xl">Redemption instructions</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            {order.product.redeemSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div className="panel p-5">
          <h2 className="text-2xl">Need help?</h2>
          <p className="mt-3 text-sm text-muted">
            If a code does not work, contact support with your transaction hash.
          </p>
          <a href="mailto:support@vouchershop.example" className="btn btn-ghost mt-4">
            Contact support
          </a>
        </div>
      </div>
    </div>
  );
}
