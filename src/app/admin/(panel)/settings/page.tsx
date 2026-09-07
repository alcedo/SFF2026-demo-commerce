import {
  ADMIN_USERNAME,
  DEMO_AUTO_PAY,
  MERCHANT_ADDRESS,
  NETWORK_NAME,
  USDC_ADDRESS,
} from "@/lib/config";

export default function SettingsPage() {
  const rows = [
    ["Network", NETWORK_NAME],
    ["USDC contract", USDC_ADDRESS],
    ["Treasury address", MERCHANT_ADDRESS],
    ["Admin username", ADMIN_USERNAME],
    ["Demo auto-detect", DEMO_AUTO_PAY ? "On" : "Off"],
  ];

  return (
    <div className="max-w-2xl">
      <p className="kicker">Config</p>
      <h1 className="mt-2 text-3xl">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Values come from environment variables. Restart the app after you change `.env.local`.
      </p>
      <dl className="panel mt-6 divide-y divide-[var(--line-soft)]">
        {rows.map(([label, value]) => (
          <div key={label} className="px-5 py-3">
            <dt className="eyebrow text-muted">{label}</dt>
            <dd className="mt-1 break-all font-mono text-sm text-green-hi">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
