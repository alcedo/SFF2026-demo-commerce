import { HDKey } from "@scure/bip32";
import { bytesToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const HD_DEPOSIT_PATH = "m/44'/60'/0'/0";

function merchantRootSeed(): Uint8Array {
  const raw = process.env.MERCHANT_PRIVATE_KEY ?? "";
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("MERCHANT_PRIVATE_KEY must be a 32-byte hex key");
  }
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
    .filter((order) => order.status === "pending" || order.status === "paid")
    .map((order) => order.derivation_index);
}
