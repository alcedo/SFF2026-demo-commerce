"use client";

import { useEffect, useState } from "react";

type Product = { id: number; name: string; priceUsdc: number };
type Voucher = {
  id: number;
  code: string;
  status: string;
  product_name: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [productId, setProductId] = useState<number>(1);
  const [codes, setCodes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/vouchers", {
      headers: { "x-admin-password": password },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Unauthorized");
    setProducts(data.products);
    setVouchers(data.vouchers);
    if (data.products[0]) setProductId(data.products[0].id);
    setAuthed(true);
  }

  useEffect(() => {
    if (!authed) return;
    const interval = setInterval(() => {
      fetch("/api/admin/vouchers", {
        headers: { "x-admin-password": password },
      })
        .then((res) => res.json())
        .then((data) => {
          setVouchers(data.vouchers);
          setProducts(data.products);
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [authed, password]);

  async function addVoucherCodes() {
    setMessage(null);
    setError(null);
    const res = await fetch("/api/admin/vouchers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ productId, codes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to add vouchers");
      return;
    }
    setMessage(`Added ${data.added} voucher code(s).`);
    setCodes("");
    await load();
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Manage voucher inventory for the store owner.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="mt-6 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        <button
          onClick={() => load().catch((e) => setError(e.message))}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Voucher inventory</h1>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Add voucher codes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.priceUsdc} USDC)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Codes (one per line)</label>
            <textarea
              value={codes}
              onChange={(e) => setCodes(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
              placeholder={"GIFT-10-NEW-001\nGIFT-10-NEW-002"}
            />
          </div>
        </div>
        <button
          onClick={addVoucherCodes}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add codes
        </button>
        {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id} className="border-b border-zinc-100">
                <td className="px-4 py-3 font-mono">{v.code}</td>
                <td className="px-4 py-3">{v.product_name}</td>
                <td className="px-4 py-3 capitalize">{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
