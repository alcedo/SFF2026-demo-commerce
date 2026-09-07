import Link from "next/link";
import { IconSearch } from "@/components/icons";
import { StatusPill } from "@/components/status-pill";
import { listAllProducts, listVouchers } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";
import { AddVoucherForm } from "./add-voucher-form";

export default async function ManageVouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const query = params.q ?? "";
  const vouchers = await listVouchers({ status, query });
  const products = await Promise.all((await listAllProducts()).map(toPublicProduct));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="kicker">Inventory</p>
          <h1 className="mt-2 text-3xl">Manage vouchers</h1>
        </div>
        <AddVoucherForm products={products} />
      </div>
      <form className="mt-6 flex gap-3" action="/admin/vouchers">
        <select name="status" defaultValue={status} className="field field-auto">
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
          <option value="used">Used</option>
          <option value="expired">Expired</option>
        </select>
        <label className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <IconSearch />
          </span>
          <input name="q" defaultValue={query} placeholder="Search codes" className="field pl-9" />
        </label>
        <button type="submit" className="btn btn-ghost h-11">
          Filter
        </button>
      </form>
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
            {vouchers.map((row) => (
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
