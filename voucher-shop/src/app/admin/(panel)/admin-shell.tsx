"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GiftLogo,
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
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 font-semibold">
          <GiftLogo className="h-7 w-7" />
          VoucherShop
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  active ? "bg-blue-50 text-brand" : "text-slate-600 hover:bg-slate-50"
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
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
        >
          <IconLogout />
          Logout
        </button>
      </aside>
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
