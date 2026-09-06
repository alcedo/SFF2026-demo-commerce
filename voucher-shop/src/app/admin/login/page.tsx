"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentixMark } from "@/components/agentix-mark";
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="panel w-full max-w-md p-8">
        <div className="flex justify-center">
          <AgentixMark className="h-10 w-10" />
        </div>
        <p className="kicker mt-5 text-center">Mission control</p>
        <h1 className="mt-3 text-center text-3xl">Admin login</h1>
        <p className="mt-2 text-center text-sm text-muted">Sign in to manage voucher inventory</p>
        <div className="mt-4 flex justify-center">
          <IconLock />
        </div>
        <label className="eyebrow mt-6 block">Username</label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="field mt-2"
          autoComplete="username"
        />
        <label className="eyebrow mt-4 block">Password</label>
        <div className="relative mt-2">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field pr-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-faint"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            <IconEye off={show} />
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <button type="submit" disabled={loading} className="btn btn-primary mt-6 h-11 w-full">
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
