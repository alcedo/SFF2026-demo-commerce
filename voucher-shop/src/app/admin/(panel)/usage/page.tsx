import Link from "next/link";
import { listVouchers } from "@/lib/db";
import { StatusPill } from "@/components/status-pill";

export default function UsageHistoryPage() {
  const rows = listVouchers();
  return (
    <div>
      <h1 className="text-2xl font-bold">Usage History</h1>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">View</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono">{row.code}</td>
                <td className="px-4 py-3">{row.product_name}</td>
                <td className="px-4 py-3">${row.usd_value}</td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/usage/${row.id}`} className="text-brand">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
