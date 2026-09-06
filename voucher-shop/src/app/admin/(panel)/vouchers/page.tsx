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
  const vouchers = listVouchers({ status, query });
  const products = listAllProducts().map(toPublicProduct);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Manage Vouchers</h1>
        <AddVoucherForm products={products} />
      </div>
      <form className="mt-6 flex gap-3" action="/admin/vouchers">
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
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
          <input
            name="q"
            defaultValue={query}
            placeholder="Search codes"
            className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm"
          />
        </label>
        <button type="submit" className="h-10 rounded-lg border border-slate-200 px-4 text-sm">
          Filter
        </button>
      </form>
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
            {vouchers.map((row) => (
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
