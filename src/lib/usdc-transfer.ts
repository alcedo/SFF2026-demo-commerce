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
