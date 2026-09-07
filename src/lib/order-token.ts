import { createHash, createHmac, timingSafeEqual } from "crypto";
import { ORDER_SECRET } from "./config";

export type OrderClaims = {
  slug: string;
  quantity: number;
  createdAtMs: number;
};

function sign(payload: string): string {
  return createHmac("sha256", ORDER_SECRET).update(payload).digest("hex").slice(0, 16);
}

export function issueOrderToken(claims: OrderClaims): string {
  const payload = `${claims.slug}.${claims.quantity}.${claims.createdAtMs}`;
  return `${payload}.${sign(payload)}`;
}

export function parseOrderToken(id: string): OrderClaims | null {
  const parts = id.split(".");
  if (parts.length !== 4) return null;
  const [slug, qtyRaw, createdRaw, sig] = parts;
  const quantity = Number(qtyRaw);
  const createdAtMs = Number(createdRaw);
  if (!slug || !Number.isFinite(quantity) || !Number.isFinite(createdAtMs)) {
    return null;
  }
  if (quantity < 1 || quantity > 20) return null;
  const payload = `${slug}.${quantity}.${createdAtMs}`;
  const expected = sign(payload);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  return { slug, quantity, createdAtMs };
}

export function demoTxHash(orderId: string): `0x${string}` {
  const hex = createHash("sha256").update(`demo:${orderId}`).digest("hex");
  return `0x${hex}`;
}

export function voucherCode(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 16).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}
