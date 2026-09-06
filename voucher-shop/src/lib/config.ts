import { sepolia } from "viem/chains";

export const CHAIN = sepolia;

export const USDC_ADDRESS =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;

export const MERCHANT_ADDRESS = (process.env.MERCHANT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

export const RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const USDC_DECIMALS = 6;

export function toMicroUsdc(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

export function fromMicroUsdc(micro: number | bigint): number {
  return Number(micro) / 10 ** USDC_DECIMALS;
}
