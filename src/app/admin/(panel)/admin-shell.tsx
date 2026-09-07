"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AgentixMark } from "@/components/agentix-mark";
import {
  IconDashboard,
  IconHistory,
  IconLogout,
  IconSettings,
  IconTickets,
} from "@/components/icons";

const links = [
  { href: "/admin", label: "Dashboard", icon: IconDashboard },
  { href: "/admin/vouchers", label: "Vouchers", icon: IconTickets },
  { href: "/admin/usage", label: "Usage History", icon: IconHistory },
  { href: "/admin/settings", label: "Settings", icon: IconSettings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-ink">
      <aside className="flex w-60 flex-col border-r border-line-soft bg-ink-1">
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <AgentixMark className="h-7 w-7" />
          <span className="leading-none">
            <span className="block text-sm font-black tracking-tight text-green-hi">AgentiX</span>
            <span className="eyebrow text-[10px] text-muted">Admin</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => {
            const active =
              link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium notch-sm ${
                  active
                    ? "bg-[rgba(0,255,153,0.1)] text-green-hi"
                    : "text-muted hover:bg-ink-3 hover:text-paper"
                }`}
              >
                <Icon />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="m-3 flex items-center gap-3 px-3 py-2 text-left text-sm text-muted hover:bg-ink-3 hover:text-paper notch-sm"
        >
          <IconLogout />
          Logout
        </button>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
