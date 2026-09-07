import { RPC_URL } from "./config";
import { mergeRpcLogs, type RpcLog } from "./usdc-log";

const RPC_TIMEOUT_MS = 4_000;

const RPC_URLS = [
  ...new Set([
    RPC_URL,
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://1rpc.io/sepolia",
    "https://sepolia.gateway.tenderly.co",
  ]),
];

export type RpcReceipt = {
  status: string;
  blockNumber: string;
  logs: RpcLog[];
};

export async function rpcOne<T>(
  url: string,
  method: string,
  params: unknown[]
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`${url} HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    result?: T;
    error?: { message: string };
  };
  if (json.error) {
    throw new Error(json.error.message);
  }
  if (json.result === undefined) {
    throw new Error(`${method} empty`);
  }
  return json.result;
}

export async function sepoliaRpc<T>(
  method: string,
  params: unknown[]
): Promise<T> {
  return await Promise.any(
    RPC_URLS.map(async (url) => {
      const result = await rpcOne<T>(url, method, params);
      if (result == null) throw new Error(`${url} empty ${method}`);
      return result;
    })
  );
}

export async function sepoliaGetLogs(input: {
  address: string;
  topics: (string | null)[];
  fromBlock: bigint;
  toBlock: bigint;
}): Promise<RpcLog[]> {
  const settled = await Promise.allSettled(
    RPC_URLS.map(async (url) => {
      const latest = BigInt(await rpcOne<string>(url, "eth_blockNumber", []));
      const head = latest > BigInt(1) ? latest - BigInt(1) : latest;
      const toBlock = input.toBlock < head ? input.toBlock : head;
      const fromBlock = input.fromBlock > toBlock ? toBlock : input.fromBlock;
      return await rpcOne<RpcLog[]>(url, "eth_getLogs", [
        {
          address: input.address,
          topics: input.topics,
          fromBlock: toHex(fromBlock),
          toBlock: toHex(toBlock),
        },
      ]);
    })
  );
  const batches = settled.flatMap((item) =>
    item.status === "fulfilled" ? [item.value] : []
  );
  if (batches.length === 0) {
    throw new Error("Sepolia getLogs failed on every RPC");
  }
  return mergeRpcLogs(batches);
}

export function toHex(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}
