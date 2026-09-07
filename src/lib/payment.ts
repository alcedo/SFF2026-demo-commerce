import {
  DEMO_AUTO_PAY,
  DEMO_AUTO_PAY_MS,
  ORDER_TTL_MS,
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
import {
  sepoliaGetLogs,
  sepoliaRpc,
  type RpcReceipt,
} from "./sepolia-rpc";
import {
  decodeUsdcTransfer,
  paddedAddress,
  TRANSFER_TOPIC,
} from "./usdc-log";
import { matchUnusedTransfer } from "./usdc-transfer";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyUsdcPayment(input: {
  txHash: `0x${string}`;
  expectedAmountMicro: bigint;
  depositAddress: `0x${string}`;
  buyerAddress?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    let receipt =
      (await sepoliaRpc<RpcReceipt | null>("eth_getTransactionReceipt", [
        input.txHash,
      ]).catch(() => null)) ?? null;
    if (!receipt) {
      await sleep(1_500);
      receipt = await sepoliaRpc<RpcReceipt | null>("eth_getTransactionReceipt", [
        input.txHash,
      ]);
    }

    if (!receipt || receipt.status !== "0x1") {
      return { ok: false, error: "Transaction failed on chain" };
    }

    const match = receipt.logs
      .map(decodeUsdcTransfer)
      .find((log) => {
        if (!log) return false;
        if (log.tx.toLowerCase() !== input.txHash.toLowerCase()) return false;
        if (log.to !== input.depositAddress.toLowerCase()) return false;
        if (log.value !== input.expectedAmountMicro) return false;
        if (
          input.buyerAddress &&
          log.from !== input.buyerAddress.toLowerCase()
        ) {
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
    const latestHex = await sepoliaRpc<string>("eth_blockNumber", []);
    const latest = BigInt(latestHex);
    const lookback = BigInt(Math.max(80, Math.ceil(ORDER_TTL_MS / 12_000) + 40));
    const fromBlock = latest > lookback ? latest - lookback : BigInt(0);
    const chunk = BigInt(80);
    const mapped: { value: bigint; tx: `0x${string}` }[] = [];
    for (let toBlock = latest; toBlock >= fromBlock; ) {
      const start =
        toBlock >= fromBlock + chunk ? toBlock - chunk + BigInt(1) : fromBlock;
      const batch = await sepoliaGetLogs({
        address: USDC_ADDRESS,
        topics: [TRANSFER_TOPIC, null, paddedAddress(input.depositAddress)],
        fromBlock: start,
        toBlock,
      });
      for (const log of batch) {
        const decoded = decodeUsdcTransfer(log);
        if (decoded) mapped.push({ value: decoded.value, tx: decoded.tx });
      }
      if (start === fromBlock) break;
      toBlock = start - BigInt(1);
    }
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
