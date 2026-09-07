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
      <button type="button" onClick={() => setOpen(true)} className="btn btn-primary">
        + Add voucher
      </button>
      {message ? <p className="mt-2 text-right text-sm text-green-hi">{message}</p> : null}
      {open ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={addCodes} className="panel w-full max-w-md p-6">
            <h2 className="text-2xl">Add voucher</h2>
            <label className="eyebrow mt-4 block">Product</label>
            <select
              value={productId}
              onChange={(event) => setProductId(Number(event.target.value))}
              className="field mt-2"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.priceUsdc} USDC)
                </option>
              ))}
            </select>
            <label className="eyebrow mt-4 block">Codes (one per line)</label>
            <textarea
              value={codes}
              onChange={(event) => setCodes(event.target.value)}
              rows={5}
              className="field mt-2 h-auto py-3 font-mono text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost h-10">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary h-10">
                Add
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
