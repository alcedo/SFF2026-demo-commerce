import { sepolia } from "viem/chains";

export const CHAIN = sepolia;
export const NETWORK_NAME = "Sepolia";

export const USDC_ADDRESS =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;

export const MERCHANT_ADDRESS = (process.env.MERCHANT_ADDRESS ??
  "0x006450335E618A9Fae2ad89542af411C8668d87D") as `0x${string}`;

export const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

export const RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const USDC_DECIMALS = 6;

export const DEMO_AUTO_PAY =
  (process.env.NEXT_PUBLIC_DEMO_AUTO_PAY ?? process.env.DEMO_AUTO_PAY) !== "0";
export const DEMO_AUTO_PAY_MS = Number(process.env.DEMO_AUTO_PAY_MS ?? "8000");

export const ADMIN_COOKIE = "vs_admin";

export const ORDER_SECRET =
  process.env.ORDER_SECRET ?? process.env.ADMIN_PASSWORD ?? "vouchershop-demo";

export function toMicroUsdc(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

export function fromMicroUsdc(micro: number | bigint): number {
  return Number(micro) / 10 ** USDC_DECIMALS;
}

export function formatUsdc(micro: number | bigint): string {
  const value = BigInt(micro);
  const zero = BigInt(0);
  const sign = value < zero ? "-" : "";
  const abs = value < zero ? -value : value;
  const base = BigInt(10) ** BigInt(USDC_DECIMALS);
  const whole = abs / base;
  const frac = (abs % base)
    .toString()
    .padStart(USDC_DECIMALS, "0")
    .replace(/0+$/, "");
  return frac.length === 0 ? `${sign}${whole}` : `${sign}${whole}.${frac}`;
}

export function formatUsd(value: number): string {
  return `$${formatUsdc(toMicroUsdc(value))} USD`;
}

export function truncateHex(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function formatDateTime(iso: string): string {
  const value = iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
