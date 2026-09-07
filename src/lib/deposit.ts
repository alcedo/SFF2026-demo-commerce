import { createHmac } from "crypto";
import { createPublicClient, http, parseAbiItem } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  CHAIN,
  DEMO_AUTO_PAY,
  DEMO_AUTO_PAY_MS,
  ORDER_SECRET,
  RPC_URL,
  USDC_ADDRESS,
} from "./config";
import { fulfillWithTx, isTxHashUsed, type Order } from "./db";
import { demoTxHash, parseOrderToken } from "./order-token";

type HexAddress = `0x${string}`;

type OrderId = string & { readonly __brand: "OrderId" };

export type DepositAddress = HexAddress & { readonly __brand: "DepositAddress" };

type TxHash = HexAddress & { readonly __brand: "TxHash" };

type AmountMicro = bigint & { readonly __brand: "AmountMicro" };

type PrivateKey = HexAddress & { readonly __brand: "PrivateKey" };

type DepositAccount = {
  address: DepositAddress;
};

type VerifyResult = { ok: true } | { ok: false; error: string };

const LOOKBACK_BLOCKS = BigInt(80);

const SECP256K1N = BigInt(
  "0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"
);

const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(RPC_URL),
});

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

function asOrderId(id: string): OrderId {
  if (!parseOrderToken(id)) {
    throw new Error("invalid order id");
  }
  return id as OrderId;
}

function hmac(orderId: OrderId): PrivateKey {
  const digest = createHmac("sha256", ORDER_SECRET)
    .update(`deposit:${orderId}`)
    .digest("hex");
  return `0x${digest}` as PrivateKey;
}

function accountFrom(key: PrivateKey): DepositAccount {
  const n = BigInt(key);
  if (n === BigInt(0) || n >= SECP256K1N) {
    throw new Error("invalid secp256k1 private key");
  }
  const account = privateKeyToAccount(key);
  return { address: account.address as DepositAddress };
}

export function depositAddressFor(orderId: string): DepositAddress {
  return accountFrom(hmac(asOrderId(orderId))).address;
}

async function findIncomingUsdcTransfer(input: {
  deposit: DepositAddress;
  expectedAmountMicro: AmountMicro;
}): Promise<TxHash | null> {
  try {
    const latest = await publicClient.getBlockNumber();
    const fromBlock =
      latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : BigInt(0);
    const logs = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: transferEvent,
      args: { to: input.deposit },
      fromBlock,
      toBlock: latest,
    });
    const match = [...logs].reverse().find((log) => {
      if (log.args.value !== input.expectedAmountMicro) return false;
      if (isTxHashUsed(log.transactionHash)) return false;
      return true;
    });
    return (match?.transactionHash as TxHash | undefined) ?? null;
  } catch {
    return null;
  }
}

function demoEligible(order: Order): boolean {
  if (!DEMO_AUTO_PAY || order.status !== "pending") return false;
  const createdMs = Date.parse(
    order.created_at.includes("T")
      ? order.created_at
      : `${order.created_at.replace(" ", "T")}Z`
  );
  return Number.isFinite(createdMs) && Date.now() - createdMs >= DEMO_AUTO_PAY_MS;
}

export async function detectAndFulfill(order: Order): Promise<Order> {
  if (order.status === "paid") return order;
  if (order.status === "pending" && order.tx_hash) {
    return fulfillWithTx({
      id: order.id,
      txHash: order.tx_hash as `0x${string}`,
    });
  }

  const found = await findIncomingUsdcTransfer({
    deposit: depositAddressFor(order.id),
    expectedAmountMicro: BigInt(order.amount_micro) as AmountMicro,
  });
  if (found) return fulfillWithTx({ id: order.id, txHash: found });

  if (demoEligible(order)) {
    return fulfillWithTx({
      id: order.id,
      txHash: demoTxHash(order.id),
    });
  }

  return order;
}

export async function verifyPostedPayment(input: {
  order: Order;
  txHash: `0x${string}`;
}): Promise<VerifyResult> {
  if (input.order.status === "paid") {
    return { ok: true };
  }

  const deposit = depositAddressFor(input.order.id);

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
      args: { to: deposit },
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
    });

    const expected = BigInt(input.order.amount_micro);
    const buyer = input.order.buyer_address?.toLowerCase();
    const match = logs.find((log) => {
      if (log.transactionHash.toLowerCase() !== input.txHash.toLowerCase()) {
        return false;
      }
      if (log.args.value !== expected) return false;
      if (buyer && log.args.from?.toLowerCase() !== buyer) return false;
      return true;
    });

    if (!match) {
      return {
        ok: false,
        error: "No matching USDC transfer to deposit in transaction",
      };
    }

    fulfillWithTx({ id: input.order.id, txHash: input.txHash });
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return { ok: false, error: message };
  }
}
