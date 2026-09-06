import { listProducts } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";
import { VoucherGrid } from "./voucher-grid";

export default function VouchersPage() {
  const products = listProducts().map(toPublicProduct);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">All Digital Vouchers</h1>
      <p className="mt-2 text-slate-500">
        Choose a brand, pay in USDC on Sepolia, and receive your codes instantly.
      </p>
      <div className="mt-8">
        <VoucherGrid products={products} />
      </div>
    </div>
  );
}
