import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDateTime, truncateHex } from "@/lib/config";
import { getVoucherById } from "@/lib/db";
import { StatusPill } from "@/components/status-pill";

export default async function UsageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voucher = getVoucherById(Number(id));
  if (!voucher) notFound();

  const rows = [
    ["Code", voucher.code],
    ["Type", voucher.product_name],
    ["Value", `$${voucher.usd_value}`],
    ["Status", voucher.status],
    ["Created At", formatDateTime(voucher.created_at)],
    ["Used At", voucher.used_at ? formatDateTime(voucher.used_at) : "—"],
    ["Transaction Hash", voucher.tx_hash ? truncateHex(voucher.tx_hash) : "—"],
  ] as const;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">Voucher usage</h1>
      <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
            <dt className="text-slate-500">{label}</dt>
            <dd className="font-medium">
              {label === "Status" ? <StatusPill status={String(value)} /> : value}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        href="/admin/usage"
        className="mt-6 inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm"
      >
        Back to Usage History
      </Link>
    </div>
  );
}
