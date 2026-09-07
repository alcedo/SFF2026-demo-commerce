import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { HDKey } from "@scure/bip32";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseAbiItem,
  parseUnits,
  bytesToHex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const BUYER_COUNT = Number(process.env.BUYER_COUNT ?? "10");
const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:4010";
const RPC_URL = process.env.SEPOLIA_RPC_URL ?? "http://127.0.0.1:8545";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const WHALE = "0x93083f60f1877a6ba974d5ed88bb74943deb8390";
const TREASURY = (process.env.MERCHANT_ADDRESS ?? "").toLowerCase();
const MERCHANT_KEY = process.env.MERCHANT_PRIVATE_KEY ?? "";
const HD_DEPOSIT_PATH = "m/44'/60'/0'/0";
const USDC_PER_BUYER = parseUnits("5", 6);

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);
const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

function demoTxHash(orderId) {
  return `0x${createHash("sha256").update(`demo:${orderId}`).digest("hex")}`;
}

function deriveDeposit(index) {
  const hex = MERCHANT_KEY.startsWith("0x") ? MERCHANT_KEY.slice(2) : MERCHANT_KEY;
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "Set MERCHANT_PRIVATE_KEY in this environment (64 hex chars, optional 0x, no quotes)"
    );
  }
  const child = HDKey.fromMasterSeed(Buffer.from(hex, "hex")).derive(
    `${HD_DEPOSIT_PATH}/${index}`
  );
  if (!child.privateKey) throw new Error("Could not derive a deposit address");
  return privateKeyToAccount(bytesToHex(child.privateKey)).address;
}

async function rpc(method, params) {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

async function requireAnvil() {
  const version = await rpc("web3_clientVersion", []);
  if (!String(version).toLowerCase().includes("anvil")) {
    throw new Error(`Expected Anvil RPC at ${RPC_URL}, got ${version}`);
  }
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requireApp() {
  const response = await fetch(`${APP_URL}/api/products`);
  if (!response.ok) {
    throw new Error(`Shop not reachable at ${APP_URL}/api/products (${response.status})`);
  }
  const body = await response.json();
  if (!Array.isArray(body.products) || body.products.length === 0) {
    throw new Error("Shop returned no products");
  }
  return body.products;
}

function pickProduct(products) {
  const stocked = products.filter((item) => item.available > 0);
  if (stocked.length === 0) throw new Error("No in-stock products");
  return stocked[Math.floor(Math.random() * stocked.length)];
}

async function fundBuyers(buyers) {
  await rpc("anvil_setBalance", [WHALE, `0x${(10n ** 18n).toString(16)}`]);
  await rpc("anvil_impersonateAccount", [WHALE]);
  const whaleClient = createWalletClient({
    account: WHALE,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  for (const buyer of buyers) {
    await rpc("anvil_setBalance", [buyer.address, `0x${(10n ** 18n).toString(16)}`]);
    const hash = await whaleClient.writeContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "transfer",
      args: [buyer.address, USDC_PER_BUYER],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    const balance = await publicClient.readContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [buyer.address],
    });
    assert.ok(balance >= USDC_PER_BUYER, `buyer ${buyer.address} USDC ${balance}`);
  }
}

async function createOrder(product, buyerAddress) {
  const response = await fetch(`${APP_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: product.slug,
      quantity: 1,
      buyerAddress,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Order creation failed");
  return body.order;
}

async function usdcBalance(address) {
  return publicClient.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

async function pay(buyer, depositAddress, amount) {
  const walletClient = createWalletClient({
    account: buyer,
    chain: sepolia,
    transport: http(RPC_URL),
  });
  const fromBlock = await publicClient.getBlockNumber();
  const before = await usdcBalance(depositAddress);
  const hash = await walletClient.writeContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [depositAddress, amount],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, "success");
  const logs = await publicClient.getLogs({
    address: USDC,
    event: transferEvent,
    args: { from: buyer.address, to: depositAddress },
    fromBlock,
    toBlock: receipt.blockNumber,
  });
  const match = logs.find(
    (log) =>
      log.transactionHash.toLowerCase() === hash.toLowerCase() &&
      log.args.value === amount
  );
  assert.ok(match, `no USDC Transfer ${hash} to ${depositAddress}`);
  const after = await usdcBalance(depositAddress);
  assert.equal(after - before, amount);
  return hash;
}

async function waitPaid(orderId) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${APP_URL}/api/orders/${orderId}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? `poll ${orderId} failed`);
    if (body.order.status === "paid") return body.order;
    if (body.order.status === "expired") {
      throw new Error(`order ${orderId} expired before detection`);
    }
    await wait(400);
  }
  throw new Error(`shop did not detect payment for ${orderId}`);
}

async function main() {
  if (!Number.isInteger(BUYER_COUNT) || BUYER_COUNT < 1) {
    throw new Error("BUYER_COUNT must be a positive integer");
  }

  await requireAnvil();
  let products = await requireApp();

  const buyers = Array.from({ length: BUYER_COUNT }, () =>
    privateKeyToAccount(generatePrivateKey())
  );
  const buyerAddresses = buyers.map((buyer) => buyer.address.toLowerCase());
  assert.equal(new Set(buyerAddresses).size, BUYER_COUNT);

  await fundBuyers(buyers);

  const deposits = new Set();
  const indexes = new Set();
  const txHashes = new Set();
  const results = [];

  for (let i = 0; i < BUYER_COUNT; i += 1) {
    products = await requireApp();
    const product = pickProduct(products);
    const buyer = buyers[i];
    const pending = await createOrder(product, buyer.address);

    assert.equal(pending.status, "pending");
    assert.equal(pending.voucherCodes?.length ?? 0, 0);
    assert.ok(pending.merchantAddress);
    assert.notEqual(pending.merchantAddress.toLowerCase(), TREASURY);
    assert.equal(
      pending.merchantAddress.toLowerCase(),
      deriveDeposit(pending.derivationIndex).toLowerCase()
    );
    assert.equal(deposits.has(pending.merchantAddress.toLowerCase()), false);
    deposits.add(pending.merchantAddress.toLowerCase());
    assert.equal(indexes.has(pending.derivationIndex), false);
    indexes.add(pending.derivationIndex);

    const amount = BigInt(pending.amountMicro);
    const hash = await pay(buyer, pending.merchantAddress, amount);
    assert.equal(txHashes.has(hash.toLowerCase()), false);
    txHashes.add(hash.toLowerCase());

    const paid = await waitPaid(pending.id);
    assert.equal(paid.status, "paid");
    assert.equal(paid.txHash.toLowerCase(), hash.toLowerCase());
    assert.notEqual(paid.txHash.toLowerCase(), demoTxHash(pending.id).toLowerCase());
    assert.equal(paid.voucherCodes.length, 1);
    assert.equal(paid.merchantAddress.toLowerCase(), pending.merchantAddress.toLowerCase());

    const row = {
      buyer: i + 1,
      buyerAddress: buyer.address,
      slug: product.slug,
      orderId: paid.id,
      derivationIndex: paid.derivationIndex,
      deposit: paid.merchantAddress,
      amountMicro: String(amount),
      txHash: paid.txHash,
      voucherCode: paid.voucherCodes[0],
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }

  assert.equal(deposits.size, BUYER_COUNT);
  assert.equal(indexes.size, BUYER_COUNT);
  assert.equal(txHashes.size, BUYER_COUNT);

  console.log(
    JSON.stringify({
      ok: true,
      buyers: BUYER_COUNT,
      uniqueBuyers: new Set(buyerAddresses).size,
      uniqueDeposits: deposits.size,
      uniqueTxHashes: txHashes.size,
      results,
    })
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
