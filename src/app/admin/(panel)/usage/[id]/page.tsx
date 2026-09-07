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
  const voucher = await getVoucherById(Number(id));
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
      <p className="kicker">Ledger</p>
      <h1 className="mt-2 text-3xl">Voucher usage</h1>
      <dl className="panel mt-6 divide-y divide-[var(--line-soft)]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
            <dt className="eyebrow text-muted">{label}</dt>
            <dd className="font-medium">
              {label === "Status" ? <StatusPill status={String(value)} /> : value}
            </dd>
          </div>
        ))}
      </dl>
      <Link href="/admin/usage" className="btn btn-ghost mt-6">
        Back to usage history
      </Link>
    </div>
  );
}
