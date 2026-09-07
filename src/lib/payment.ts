import { createPublicClient, http, parseAbiItem } from "viem";
import {
  CHAIN,
  DEMO_AUTO_PAY,
  DEMO_AUTO_PAY_MS,
  ORDER_TTL_MS,
  RPC_URL,
  USDC_ADDRESS,
} from "./config";
import {
  expireOrder,
  fulfillOrder,
  getOrder,
  isInvoiceAged,
  isTxHashUsed,
  listPendingOrders,
  setOrderTxHash,
  type Order,
} from "./db";
import { orderDepositAddress } from "./order-deposit";
import { demoTxHash } from "./order-token";
import { matchUnusedTransfer } from "./usdc-transfer";

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL, { timeout: 8_000 }),
});

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

export async function verifyUsdcPayment(input: {
  txHash: `0x${string}`;
  expectedAmountMicro: bigint;
  depositAddress: `0x${string}`;
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
      if (to !== input.depositAddress.toLowerCase()) return false;
      if (value !== input.expectedAmountMicro) return false;
      if (input.buyerAddress && from !== input.buyerAddress.toLowerCase()) {
        return false;
      }
      return true;
    });

    if (!match) {
      return {
        ok: false,
        error: "No matching USDC transfer to this order's address",
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
  depositAddress: `0x${string}`;
}): Promise<`0x${string}` | null> {
  try {
    const latest = await publicClient.getBlockNumber();
    const lookback = BigInt(Math.max(80, Math.ceil(ORDER_TTL_MS / 12_000) + 40));
    const fromBlock = latest > lookback ? latest - lookback : BigInt(0);
    const logs = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: transferEvent,
      args: { to: input.depositAddress },
      fromBlock,
      toBlock: latest,
    });
    const mapped = logs.flatMap((log) =>
      log.args.value === undefined
        ? []
        : [{ value: log.args.value, tx: log.transactionHash }]
    );
    const used = new Set(
      (
        await Promise.all(
          mapped.map(async (log) =>
            (await isTxHashUsed(log.tx)) ? log.tx : null
          )
        )
      ).filter((tx): tx is `0x${string}` => Boolean(tx))
    );
    return matchUnusedTransfer(mapped, input.expectedAmountMicro, used);
  } catch {
    return null;
  }
}

export async function reconcileAgedInvoices(): Promise<void> {
  for (const order of await listPendingOrders()) {
    if (!isInvoiceAged(order)) continue;
    await detectAndFulfill(order);
  }
}

export async function detectAndFulfill(order: Order): Promise<Order> {
  if (order.status === "paid" || order.status === "expired") return order;

  if (!DEMO_AUTO_PAY) {
    const onchain = await findIncomingUsdcTransfer({
      expectedAmountMicro: BigInt(order.amount_micro),
      depositAddress: orderDepositAddress(order.derivation_index),
    });
    if (onchain) {
      if (await setOrderTxHash(order.id, onchain)) await fulfillOrder(order.id);
      return (await getOrder(order.id))!;
    }
  }

  if (DEMO_AUTO_PAY) {
    const createdMs = Date.now() - Date.parse(
      order.created_at.includes("T")
        ? order.created_at
        : `${order.created_at.replace(" ", "T")}Z`
    );
    if (Number.isFinite(createdMs) && createdMs >= DEMO_AUTO_PAY_MS) {
      if (await setOrderTxHash(order.id, demoTxHash(order.id))) {
        await fulfillOrder(order.id);
      }
      return (await getOrder(order.id))!;
    }
  }

  if (isInvoiceAged(order)) {
    await expireOrder(order.id);
    return (await getOrder(order.id))!;
  }

  return order;
}
