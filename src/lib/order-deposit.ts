import { createHmac } from "crypto";
import { privateKeyToAccount } from "viem/accounts";

const DEPOSIT_INFO = "vouchershop:order:";
const DERIVE_ATTEMPTS = 8;

function merchantRootKey(): Buffer {
  const raw = process.env.MERCHANT_PRIVATE_KEY ?? "";
  const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("MERCHANT_PRIVATE_KEY must be a 32-byte hex key");
  }
  return Buffer.from(hex, "hex");
}

export function orderDepositAddress(orderId: string): `0x${string}` {
  const root = merchantRootKey();
  for (let attempt = 0; attempt < DERIVE_ATTEMPTS; attempt += 1) {
    const digest = createHmac("sha256", root)
      .update(`${DEPOSIT_INFO}${orderId}:${attempt}`)
      .digest("hex");
    try {
      return privateKeyToAccount(`0x${digest}`).address;
    } catch {
      continue;
    }
  }
  throw new Error("Could not derive a deposit address");
}
