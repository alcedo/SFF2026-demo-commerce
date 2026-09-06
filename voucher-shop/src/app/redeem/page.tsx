"use client";

import { useState } from "react";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function redeem() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Redeem failed");
      setMessage("Voucher redeemed successfully.");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Redeem failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">Redeem voucher</h1>
      <p className="mt-2 text-zinc-600">
        Enter your voucher code to mark it as used in our system.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium">Voucher code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono"
          placeholder="GIFT-10-ALPHA"
        />
        <button
          onClick={redeem}
          disabled={!code || loading}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Redeeming..." : "Redeem"}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
