import Link from "next/link";
import { listVouchers } from "@/lib/db";
import { StatusPill } from "@/components/status-pill";

export default function UsageHistoryPage() {
  const rows = listVouchers();
  return (
    <div>
      <p className="kicker">Ledger</p>
      <h1 className="mt-2 text-3xl">Usage history</h1>
      <div className="panel mt-6 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-mono text-green-hi">{row.code}</td>
                <td>{row.product_name}</td>
                <td>${row.usd_value}</td>
                <td>
                  <StatusPill status={row.status} />
                </td>
                <td>
                  <Link href={`/admin/usage/${row.id}`} className="text-green-hi">
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
