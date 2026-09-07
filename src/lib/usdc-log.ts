export const USDC_TOKEN =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as const;

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

export function decodeUsdcTransfer(log: RpcLog): DecodedTransfer | null {
  if (log.address.toLowerCase() !== USDC_TOKEN.toLowerCase()) return null;
  if (log.topics[0]?.toLowerCase() !== TRANSFER_TOPIC) return null;
  if (log.topics.length < 3) return null;
  return {
    from: topicAddress(log.topics[1]),
    to: topicAddress(log.topics[2]),
    value: BigInt(log.data),
    tx: log.transactionHash as `0x${string}`,
  };
}
