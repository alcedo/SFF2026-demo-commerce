import { HDKey } from "@scure/bip32";
import { bytesToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const HD_DEPOSIT_PATH = "m/44'/60'/0'/0";

const DEMO_MERCHANT_PRIVATE_KEY =
  "0x55d0c426bccaff91404aaaa8e901b0c94d47c0e1c98703400d6761cffee0cf06";

export const MERCHANT_KEY_ERROR =
  "Set MERCHANT_PRIVATE_KEY in this environment (64 hex chars, optional 0x, no quotes)";

export type MerchantKeySource = "env" | "demo" | "invalid";

function normalizePrivateKeyHex(raw: string | undefined): string | undefined {
  let trimmed = (raw ?? "").trim();
  trimmed = trimmed.replace(/^['"]|['"]$/g, "").trim();
  trimmed = trimmed.replace(/^MERCHANT_PRIVATE_KEY\s*=\s*/i, "").trim();
  trimmed = trimmed.replace(/^['"]|['"]$/g, "").trim();
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return undefined;
  return hex.toLowerCase();
}

export function merchantPrivateKeyHex(
  raw = process.env.MERCHANT_PRIVATE_KEY
): string | undefined {
  const fromRaw = normalizePrivateKeyHex(raw);
  if (fromRaw) return fromRaw;
  if ((raw ?? "").trim() === "") {
    return normalizePrivateKeyHex(DEMO_MERCHANT_PRIVATE_KEY);
  }
  return undefined;
}

export function merchantPrivateKeyConfigured(): boolean {
  return Boolean(merchantPrivateKeyHex());
}

export function merchantPrivateKeySource(): MerchantKeySource {
  const raw = process.env.MERCHANT_PRIVATE_KEY;
  if (normalizePrivateKeyHex(raw)) return "env";
  if ((raw ?? "").trim() === "") return "demo";
  return "invalid";
}

function merchantRootSeed(): Uint8Array {
  const hex = merchantPrivateKeyHex();
  if (!hex) throw new Error(MERCHANT_KEY_ERROR);
  return Buffer.from(hex, "hex");
}

export function orderDepositAddress(index: number): `0x${string}` {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("derivation index must be a non-negative integer");
  }
  const child = HDKey.fromMasterSeed(merchantRootSeed()).derive(
    `${HD_DEPOSIT_PATH}/${index}`
  );
  if (!child.privateKey) {
    throw new Error("Could not derive a deposit address");
  }
  return privateKeyToAccount(bytesToHex(child.privateKey)).address;
}

export function allocateHdIndex(held: Iterable<number>): number {
  const taken = new Set(held);
  let index = 0;
  while (taken.has(index)) index += 1;
  return index;
}

export function heldDerivationIndices(
  orders: { status: string; derivation_index: number }[]
): number[] {
  return orders
    .filter(
      (order) =>
        order.status === "pending" ||
        order.status === "paid" ||
        order.status === "expired"
    )
    .map((order) => order.derivation_index);
}
