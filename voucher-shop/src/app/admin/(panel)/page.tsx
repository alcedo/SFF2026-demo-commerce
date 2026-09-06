import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/config";
import { listRecentActivity, voucherStats } from "@/lib/db";

export default function AdminDashboardPage() {
  const stats = voucherStats();
  const recent = listRecentActivity();
  const cards = [
    { label: "Total Vouchers", value: stats.total, className: "bg-blue-50 text-brand" },
    { label: "Available", value: stats.available, className: "bg-emerald-50 text-success" },
    { label: "Used", value: stats.used, className: "bg-orange-50 text-warning" },
    { label: "Expired", value: stats.expired, className: "bg-red-50 text-danger" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-2xl p-5 ${card.className}`}>
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-semibold">Recent Activity</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Voucher Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-500">
                  {formatDateTime(row.used_at ?? row.sold_at ?? row.created_at)}
                </td>
                <td className="px-4 py-3 font-mono">{row.code}</td>
                <td className="px-4 py-3">{row.brand}</td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/admin/usage" className="mt-4 inline-block text-sm text-brand">
        View all usage history
      </Link>
    </div>
  );
}
