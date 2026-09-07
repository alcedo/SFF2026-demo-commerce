import { randomInt } from "crypto";

export const PAY_TAG_MIN = 1;
export const PAY_TAG_MAX = 9_999;
export const PAY_TAG_ALLOCATE_ATTEMPTS = 32;

export function newPayTag(): number {
  return randomInt(PAY_TAG_MIN, PAY_TAG_MAX + 1);
}

export function payableAmountMicro(baseMicro: number, payTag: number): number {
  if (!Number.isInteger(payTag) || payTag < PAY_TAG_MIN || payTag > PAY_TAG_MAX) {
    throw new Error("payTag out of range");
  }
  return baseMicro + payTag;
}

export function matchUnusedTransfer<H extends string>(
  logs: { value: bigint; tx: H }[],
  expectedAmountMicro: bigint,
  usedHashes: Set<string>
): H | null {
  const match = [...logs].reverse().find((log) => {
    if (log.value !== expectedAmountMicro) return false;
    if (usedHashes.has(log.tx)) return false;
    return true;
  });
  return match?.tx ?? null;
}
