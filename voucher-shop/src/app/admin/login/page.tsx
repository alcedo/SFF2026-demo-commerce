"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconLock } from "@/components/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
      >
        <div className="flex justify-center">
          <IconLock />
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Sign in to manage voucher inventory
        </p>
        <label className="mt-6 block text-sm font-medium">Username</label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3"
          autoComplete="username"
        />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <div className="relative mt-1">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            <IconEye off={show} />
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-brand font-semibold text-white"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
