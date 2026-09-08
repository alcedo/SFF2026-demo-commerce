import { createHash } from "node:crypto";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const COUNT = Number(process.env.BUYER_COUNT ?? "3");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function demoTxHash(orderId) {
  return `0x${createHash("sha256").update(`demo:${orderId}`).digest("hex")}`;
}

function requireUnique(label, values) {
  const unique = new Set(values);
  if (unique.size === COUNT) return unique;
  const collisions = [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
  throw new Error(`${label} collision: ${collisions.join(", ")}`);
}

async function waitUntilPaid(orderId) {
  for (let i = 0; i < 20; i += 1) {
    await wait(1000);
    const poll = await fetch(`${APP_URL}/api/orders/${orderId}`);
    const body = await poll.json();
    if (body.order?.status === "paid") return body.order;
  }
  throw new Error(`Order ${orderId} did not auto-fulfill`);
}

async function main() {
  if (!Number.isInteger(COUNT) || COUNT < 1) {
    throw new Error(`BUYER_COUNT must be a positive integer, got ${JSON.stringify(process.env.BUYER_COUNT)}`);
  }

  const productsRes = await fetch(`${APP_URL}/api/products`);
  if (!productsRes.ok) {
    throw new Error(`products ${productsRes.status}`);
  }
  const { products } = await productsRes.json();
  const product = products.find((item) => item.slug === "amazon") ?? products[0];
  if (!product) throw new Error("No products");
  if (product.available < COUNT) {
    throw new Error(`Need ${COUNT} in stock, got ${product.available}`);
  }

  const created = await Promise.all(
    Array.from({ length: COUNT }, async () => {
      const orderRes = await fetch(`${APP_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "amazon", quantity: 1 }),
      });
      const orderBody = await orderRes.text();
      if (!orderRes.ok) {
        throw new Error(`order POST ${orderRes.status} ${orderBody}`);
      }
      return JSON.parse(orderBody).order;
    })
  );

  if (created.length !== COUNT) {
    throw new Error(`expected ${COUNT} orders, got ${created.length}`);
  }

  for (const order of created) {
    if (order.status !== "pending") {
      throw new Error(`expected pending, got ${order.status} (${order.id})`);
    }
    if (!order.merchantAddress) {
      throw new Error(`missing merchantAddress (${order.id})`);
    }
    if (order.voucherCodes?.length) {
      throw new Error(`pending order leaked codes (${order.id})`);
    }
  }

  const uniqueWallets = requireUnique(
    "merchantAddress",
    created.map((order) => order.merchantAddress.toLowerCase())
  );
  const uniqueIndexes = requireUnique(
    "derivationIndex",
    created.map((order) => order.derivationIndex)
  );
  requireUnique(
    "id",
    created.map((order) => order.id)
  );

  const paid = await Promise.all(created.map((order) => waitUntilPaid(order.id)));

  for (const order of paid) {
    if (order.status !== "paid") {
      throw new Error(`expected paid, got ${order.status} (${order.id})`);
    }
    if (order.voucherCodes?.length !== 1) {
      throw new Error(`expected 1 voucher, got ${order.voucherCodes?.length} (${order.id})`);
    }
    const expected = demoTxHash(order.id);
    if (order.txHash !== expected) {
      throw new Error(`txHash ${order.txHash} !== ${expected} (${order.id})`);
    }
  }

  const uniqueTxHashes = requireUnique(
    "txHash",
    paid.map((order) => order.txHash)
  );

  console.log(
    JSON.stringify({
      ok: true,
      count: COUNT,
      uniqueWallets: [...uniqueWallets],
      uniqueIndexes: [...uniqueIndexes],
      uniqueTxHashes: [...uniqueTxHashes],
      orders: paid.map((order) => ({
        id: order.id,
        merchantAddress: order.merchantAddress,
        derivationIndex: order.derivationIndex,
        txHash: order.txHash,
      })),
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
