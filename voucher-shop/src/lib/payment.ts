import { createHash } from "crypto";
import { createPublicClient, http, parseAbiItem } from "viem";
import {
  CHAIN,
  DEMO_AUTO_PAY,
  DEMO_AUTO_PAY_MS,
  MERCHANT_ADDRESS,
  RPC_URL,
  USDC_ADDRESS,
} from "./config";
import {
  fulfillOrder,
  getOrder,
  isTxHashUsed,
  setOrderTxHash,
  type Order,
} from "./db";

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export async function verifyUsdcPayment(input: {
  txHash: `0x${string}`;
  expectedAmountMicro: bigint;
  buyerAddress?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: input.txHash,
      confirmations: 1,
    });

    if (receipt.status !== "success") {
      return { ok: false, error: "Transaction failed on chain" };
    }

    const logs = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: transferEvent,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    const match = logs.find((log) => {
      const to = log.args.to?.toLowerCase();
      const from = log.args.from?.toLowerCase();
      const value = log.args.value;
      if (to !== MERCHANT_ADDRESS.toLowerCase()) return false;
      if (value !== input.expectedAmountMicro) return false;
      if (input.buyerAddress && from !== input.buyerAddress.toLowerCase()) {
        return false;
      }
      return true;
    });

    if (!match) {
      return {
        ok: false,
        error: "No matching USDC transfer to merchant in transaction",
      };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return { ok: false, error: message };
  }
}

export async function findIncomingUsdcTransfer(input: {
  expectedAmountMicro: bigint;
}): Promise<`0x${string}` | null> {
  try {
    const latest = await publicClient.getBlockNumber();
    const lookback = BigInt(80);
    const fromBlock = latest > lookback ? latest - lookback : BigInt(0);
    const logs = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: transferEvent,
      args: { to: MERCHANT_ADDRESS },
      fromBlock,
      toBlock: latest,
    });
    const match = [...logs].reverse().find((log) => {
      if (log.args.value !== input.expectedAmountMicro) return false;
      if (isTxHashUsed(log.transactionHash)) return false;
      return true;
    });
    return match?.transactionHash ?? null;
  } catch {
    return null;
  }
}

export function demoTxHash(orderId: string): `0x${string}` {
  const hex = createHash("sha256").update(`demo:${orderId}`).digest("hex");
  return `0x${hex}`;
}

export async function detectAndFulfill(order: Order): Promise<Order> {
  if (order.status === "paid") return order;

  const onchain = await findIncomingUsdcTransfer({
    expectedAmountMicro: BigInt(order.amount_micro),
  });
  if (onchain) {
    setOrderTxHash(order.id, onchain);
    fulfillOrder(order.id);
    return getOrder(order.id)!;
  }

  if (DEMO_AUTO_PAY) {
    const createdMs = Date.now() - Date.parse(
      order.created_at.includes("T")
        ? order.created_at
        : `${order.created_at.replace(" ", "T")}Z`
    );
    if (Number.isFinite(createdMs) && createdMs >= DEMO_AUTO_PAY_MS) {
      setOrderTxHash(order.id, demoTxHash(order.id));
      fulfillOrder(order.id);
      return getOrder(order.id)!;
    }
  }

  return order;
}
