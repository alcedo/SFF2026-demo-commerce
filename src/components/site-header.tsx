"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgentixMark } from "./agentix-mark";

const links = [
  { href: "/", label: "Home" },
  { href: "/vouchers", label: "Vouchers" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-[linear-gradient(rgba(5,5,5,0.92),rgba(5,5,5,0.4)_70%,transparent)] backdrop-blur-[10px]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <AgentixMark />
          <span className="leading-none">
            <span className="block font-black tracking-tight text-green-hi">AgentiX</span>
            <span className="eyebrow text-[10px] tracking-[0.28em] text-muted">
              Playground
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.18em] sm:gap-8">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "text-green-hi" : "text-muted hover:text-paper"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="glow-dot" />
          <span className="eyebrow text-[10px] text-muted">Live · Sepolia</span>
        </div>
      </div>
    </header>
  );
}
