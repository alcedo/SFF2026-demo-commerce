import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const SHARE = process.env.VERCEL_SHARE ?? "";
const RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const HOLD_MS = Number(process.env.LIVE_HOLD_MS ?? "12000");
const POLL_MS = Number(process.env.LIVE_POLL_MS ?? "4000");
const POLL_ATTEMPTS = Number(process.env.LIVE_POLL_ATTEMPTS ?? "30");
const buyerKey = process.env.TEST_BUYER_PRIVATE_KEY;
const evidencePath = process.env.EVIDENCE_JSON;

if (!buyerKey) {
  console.error("Set TEST_BUYER_PRIVATE_KEY");
  process.exit(1);
}

const account = privateKeyToAccount(buyerKey);
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
});
const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);
const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

function demoTxHash(orderId) {
  return `0x${createHash("sha256").update(`demo:${orderId}`).digest("hex")}`;
}

function appUrl(path) {
  const base = new URL(APP_URL);
  const url = new URL(path, base.origin);
  for (const [key, value] of base.searchParams) {
    url.searchParams.set(key, value);
  }
  if (SHARE) url.searchParams.set("_vercel_share", SHARE);
  return url.toString();
}

async function api(path, init) {
  const response = await fetch(appUrl(path), init);
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON (${response.status}): ${text.slice(0, 180)}`);
  }
  return { response, body };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (process.env.SKIP_HEALTH !== "1") {
    const health = await api("/api/health/db");
    assert.equal(health.response.ok, true, health.body.error ?? "health failed");
    assert.equal(health.body.demoAutoPay, false, "health demoAutoPay must be false");
    assert.equal(health.body.ok, true);
    assert.equal(health.body.store, "neon");
    assert.equal(health.body.merchantKey, true);
  }

  const productsRes = await api("/api/products");
  assert.equal(productsRes.response.ok, true, productsRes.body.error ?? "products failed");
  const product =
    productsRes.body.products.find((item) => item.slug === "amazon") ??
    productsRes.body.products[0];
  assert.ok(product, "No products available");
  assert.ok(product.available >= 1, "Amazon has no stock");

  let pending;
  if (process.env.ORDER_ID) {
    const existing = await api(`/api/orders/${process.env.ORDER_ID}`);
    assert.equal(existing.response.ok, true, existing.body.error ?? "order lookup failed");
    pending = existing.body.order;
  } else {
    const orderRes = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        quantity: 1,
        buyerAddress: account.address,
      }),
    });
    assert.equal(
      orderRes.response.ok,
      true,
      orderRes.body.error ?? "Order creation failed"
    );
    pending = orderRes.body.order;
  }
  assert.equal(pending.status, "pending");
  assert.deepEqual(pending.voucherCodes, []);
  assert.ok(pending.merchantAddress);
  assert.ok(pending.amountMicro != null);

  await sleep(HOLD_MS);
  const heldRes = await api(`/api/orders/${pending.id}`);
  assert.equal(heldRes.response.ok, true, heldRes.body.error ?? "held poll failed");
  const held = heldRes.body.order;
  assert.equal(
    held.status,
    "pending",
    `order auto-paid as ${held.status} with tx ${held.txHash}`
  );
  assert.notEqual(
    (held.txHash ?? "").toLowerCase(),
    demoTxHash(pending.id).toLowerCase(),
    "demo digest appeared before a wallet transfer"
  );

  const amount = BigInt(pending.amountMicro);
  const depositAddress = pending.merchantAddress;
  const [eth, usdc, depositBefore] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    publicClient.readContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account.address],
    }),
    publicClient.readContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [depositAddress],
    }),
  ]);
  if (eth === 0n) {
    throw new Error(`Buyer ${account.address} has 0 ETH for gas. Fund on Sepolia.`);
  }
  if (usdc < amount) {
    throw new Error(
      `Buyer ${account.address} has ${Number(usdc) / 1e6} USDC, need ${Number(amount) / 1e6}.`
    );
  }

  const hash = await walletClient.writeContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [depositAddress, amount],
  });
  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  });
  assert.equal(receipt.status, "success");

  const verifyRes = await api(`/api/orders/${pending.id}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash: hash }),
  });

  let paid = verifyRes.body.order;
  if (!verifyRes.response.ok) {
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
      const poll = await api(`/api/orders/${pending.id}`);
      if (poll.body.order?.status === "paid") {
        paid = poll.body.order;
        break;
      }
      await sleep(POLL_MS);
    }
  }

  assert.equal(paid?.status, "paid", verifyRes.body.error ?? "order did not become paid");
  assert.equal(paid.voucherCodes.length, 1);
  assert.match(paid.voucherCodes[0], /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/);
  assert.equal(paid.txHash.toLowerCase(), hash.toLowerCase());
  assert.notEqual(paid.txHash.toLowerCase(), demoTxHash(pending.id).toLowerCase());

  const logs = await publicClient.getLogs({
    address: USDC,
    event: transferEvent,
    args: { to: depositAddress },
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });
  const match = logs.find(
    (log) =>
      log.transactionHash.toLowerCase() === hash.toLowerCase() &&
      log.args.value === amount &&
      log.args.from?.toLowerCase() === account.address.toLowerCase()
  );
  assert.ok(match, "no matching on-chain USDC Transfer for this invoice");

  const depositAfter = await publicClient.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [depositAddress],
  });
  assert.equal(depositAfter - depositBefore, amount);

  const proof = {
    appUrl: new URL(APP_URL).origin,
    orderId: paid.id,
    status: paid.status,
    amountMicro: paid.amountMicro,
    depositAddress,
    txHash: paid.txHash,
    demoTxHash: demoTxHash(pending.id),
    voucherCodes: paid.voucherCodes,
    blockNumber: receipt.blockNumber.toString(),
  };
  console.log(JSON.stringify(proof, null, 2));
  if (evidencePath) writeFileSync(evidencePath, `${JSON.stringify(proof, null, 2)}\n`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
