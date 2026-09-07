import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/config";
import { listRecentActivity, voucherStats } from "@/lib/db";

export default async function AdminDashboardPage() {
  const stats = await voucherStats();
  const recent = await listRecentActivity();
  const cards = [
    { label: "Total Vouchers", value: stats.total, className: "text-green-hi" },
    { label: "Available", value: stats.available, className: "text-green" },
    { label: "Used", value: stats.used, className: "text-warning" },
    { label: "Expired", value: stats.expired, className: "text-danger" },
  ];

  return (
    <div>
      <p className="kicker">Mission control</p>
      <h1 className="mt-2 text-3xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="panel p-5">
            <p className="eyebrow text-muted">{card.label}</p>
            <p className={`mt-2 text-3xl font-black ${card.className}`}>{card.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-2xl">Recent activity</h2>
      <div className="panel mt-4 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Voucher Code</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id}>
                <td className="text-muted">
                  {formatDateTime(row.used_at ?? row.sold_at ?? row.created_at)}
                </td>
                <td className="font-mono text-green-hi">{row.code}</td>
                <td>{row.brand}</td>
                <td>
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/admin/usage" className="eyebrow mt-4 inline-block text-green-hi">
        View all usage history
      </Link>
    </div>
  );
}
