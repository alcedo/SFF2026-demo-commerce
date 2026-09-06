import type { CardTheme } from "@/lib/catalog";

const themes: Record<
  CardTheme,
  { bg: string; fg: string; accent: string; mark: string }
> = {
  amazon: { bg: "#111111", fg: "#ffffff", accent: "#FF9900", mark: "amazon" },
  netflix: { bg: "#141414", fg: "#ffffff", accent: "#E50914", mark: "NETFLIX" },
  steam: { bg: "#1b2838", fg: "#ffffff", accent: "#66c0f4", mark: "STEAM" },
  spotify: { bg: "#191414", fg: "#ffffff", accent: "#1DB954", mark: "Spotify" },
  google: { bg: "#01875f", fg: "#ffffff", accent: "#34a853", mark: "Google Play" },
  apple: { bg: "#2f2f2f", fg: "#ffffff", accent: "#d1d1d6", mark: "Apple" },
  xbox: { bg: "#107C10", fg: "#ffffff", accent: "#9bf00b", mark: "Xbox" },
  grab: { bg: "#00B14F", fg: "#ffffff", accent: "#0A3D2C", mark: "Grab" },
  shopee: { bg: "#EE4D2D", fg: "#ffffff", accent: "#fff3e0", mark: "Shopee" },
};

export function GiftCardArt({
  theme,
  usdValue,
  className = "",
}: {
  theme: string;
  usdValue: number;
  className?: string;
}) {
  const style = themes[(theme as CardTheme) ?? "amazon"] ?? themes.amazon;
  return (
    <div
      className={`relative overflow-hidden rounded-xl shadow-md ${className}`}
      style={{ background: style.bg, color: style.fg }}
    >
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 80% 20%, ${style.accent}, transparent 50%)` }} />
      <div className="relative flex h-full min-h-[140px] flex-col justify-between p-4">
        <div className="text-xs font-semibold tracking-wide opacity-80">Gift Card</div>
        <div className="text-lg font-bold tracking-tight">{style.mark}</div>
        <div className="text-2xl font-semibold">${usdValue}</div>
      </div>
    </div>
  );
}
