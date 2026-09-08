import { USDC_ADDRESS } from "./config.ts";

export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export type RpcLog = {
  address: string;
  topics: string[];
  data: string;
  transactionHash: string;
};

export type DecodedTransfer = {
  from: string;
  to: string;
  value: bigint;
  tx: `0x${string}`;
};

export function topicAddress(topic: string): string {
  return `0x${topic.slice(26)}`.toLowerCase();
}

export function paddedAddress(address: string): `0x${string}` {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

export function mergeRpcLogs(batches: RpcLog[][]): RpcLog[] {
  const merged: RpcLog[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    for (const log of batch) {
      const key = `${log.transactionHash}:${log.topics.join(":")}:${log.data}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(log);
    }
  }
  return merged;
}

export function decodeUsdcTransfer(log: RpcLog): DecodedTransfer | null {
  if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) return null;
  if (log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) return null;
  if (log.topics.length < 3) return null;
  return {
    from: topicAddress(log.topics[1]),
    to: topicAddress(log.topics[2]),
    value: BigInt(log.data),
    tx: log.transactionHash as `0x${string}`,
  };
}
