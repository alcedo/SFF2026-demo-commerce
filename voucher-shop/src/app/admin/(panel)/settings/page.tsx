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
    ["Merchant address", MERCHANT_ADDRESS],
    ["Admin username", ADMIN_USERNAME],
    ["Demo auto-detect", DEMO_AUTO_PAY ? "On" : "Off"],
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-slate-500">
        Values come from environment variables. Restart the app after you change `.env.local`.
      </p>
      <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
        {rows.map(([label, value]) => (
          <div key={label} className="px-5 py-3">
            <dt className="text-xs text-slate-500">{label}</dt>
            <dd className="mt-1 break-all font-mono text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
