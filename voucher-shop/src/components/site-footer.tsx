import { PixelMascot } from "./agentix-mark";

export function SiteFooter() {
  return (
    <footer className="relative mt-8 border-t border-line-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kicker">Where agents learn to pay</p>
          <p className="mt-3 max-w-md text-sm text-muted">
            Digital voucher rails for AgentiX Playground · Singapore FinTech Festival 2026.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <p className="eyebrow text-faint">Powered by</p>
            <p className="mt-1 font-black tracking-tight">StraitsX · USDC</p>
          </div>
          <PixelMascot className="h-14 w-14 drop-shadow-[0_0_14px_#00FF99]" />
        </div>
      </div>
    </footer>
  );
}
