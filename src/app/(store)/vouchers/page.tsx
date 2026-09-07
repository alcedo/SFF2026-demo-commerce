import { listProducts } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";
import { VoucherGrid } from "./voucher-grid";

export default async function VouchersPage() {
  const products = await Promise.all((await listProducts()).map(toPublicProduct));
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="kicker">Build zone</p>
      <h1 className="mt-3 text-4xl md:text-5xl">All digital vouchers</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Choose a brand, pay in USDC on Sepolia, and receive your codes instantly.
      </p>
      <div className="mt-8">
        <VoucherGrid products={products} />
      </div>
    </div>
  );
}
