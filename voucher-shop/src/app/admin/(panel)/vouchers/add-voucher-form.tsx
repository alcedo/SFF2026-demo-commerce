"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Product = { id: number; name: string; priceUsdc: number };

export function AddVoucherForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [codes, setCodes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function addCodes(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, codes }),
    });
    const data = (await res.json()) as { added?: number; error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Failed");
      return;
    }
    setCodes("");
    setOpen(false);
    setMessage(`Added ${data.added} voucher(s).`);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
      >
        + Add Voucher
      </button>
      {message ? <p className="mt-2 text-right text-sm text-success">{message}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={addCodes} className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold">Add Voucher</h2>
            <label className="mt-4 block text-sm">Product</label>
            <select
              value={productId}
              onChange={(event) => setProductId(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.priceUsdc} USDC)
                </option>
              ))}
            </select>
            <label className="mt-4 block text-sm">Codes (one per line)</label>
            <textarea
              value={codes}
              onChange={(event) => setCodes(event.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 font-mono text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg px-4 text-sm">
                Cancel
              </button>
              <button type="submit" className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white">
                Add
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
