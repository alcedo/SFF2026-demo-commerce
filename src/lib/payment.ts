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
import { demoTxHash } from "./order-token";
import { matchUnusedTransfer } from "./payable-amount";

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
      if (log.transactionHash.toLowerCase() !== input.txHash.toLowerCase()) {
        return false;
      }
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
    const mapped = logs.flatMap((log) =>
      log.args.value === undefined
        ? []
        : [{ value: log.args.value, tx: log.transactionHash }]
    );
    const used = new Set(
      mapped.filter((log) => isTxHashUsed(log.tx)).map((log) => log.tx)
    );
    return matchUnusedTransfer(mapped, input.expectedAmountMicro, used);
  } catch {
    return null;
  }
}

export async function detectAndFulfill(order: Order): Promise<Order> {
  if (order.status === "paid") return order;

  const onchain = await findIncomingUsdcTransfer({
    expectedAmountMicro: BigInt(order.amount_micro),
  });
  if (onchain) {
    if (setOrderTxHash(order.id, onchain)) fulfillOrder(order.id);
    return getOrder(order.id)!;
  }

  if (DEMO_AUTO_PAY) {
    const createdMs = Date.now() - Date.parse(
      order.created_at.includes("T")
        ? order.created_at
        : `${order.created_at.replace(" ", "T")}Z`
    );
    if (Number.isFinite(createdMs) && createdMs >= DEMO_AUTO_PAY_MS) {
      if (setOrderTxHash(order.id, demoTxHash(order.id))) fulfillOrder(order.id);
      return getOrder(order.id)!;
    }
  }

  return order;
}
