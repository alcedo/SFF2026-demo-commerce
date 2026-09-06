import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          VoucherVault
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="text-zinc-600 hover:text-zinc-900">
            Shop
          </Link>
          <Link href="/redeem" className="text-zinc-600 hover:text-zinc-900">
            Redeem
          </Link>
          <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
