"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GiftLogo } from "./icons";

const links = [
  { href: "/", label: "Home" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <GiftLogo />
          <span>VoucherShop</span>
        </Link>
        <nav className="flex items-center gap-8 text-sm font-medium">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "text-brand" : "text-slate-500 hover:text-slate-800"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
