import { createHash } from "crypto";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const APP_URL = process.env.APP_URL;
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const WHALE = "0x93083f60f1877a6ba974d5ed88bb74943deb8390";
const BUYER_COUNT = 10;
const USDC_EACH_MICRO = 25_000_000n;
const ETH_EACH_WEI = 10n ** 18n;

if (!APP_URL) {
  throw new Error("APP_URL is required");
}
if (RPC_URL !== "http://127.0.0.1:8545") {
  throw new Error(
    `SEPOLIA_RPC_URL must be http://127.0.0.1:8545, got ${RPC_URL ?? "(unset)"}`
  );
}
if (process.env.DEMO_AUTO_PAY !== "0") {
  throw new Error("DEMO_AUTO_PAY must be 0");
}

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

function demoTxHash(orderId) {
  return `0x${createHash("sha256").update(`demo:${orderId}`).digest("hex")}`;
}

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) {
    throw new Error(`${method}: ${body.error.message ?? JSON.stringify(body.error)}`);
  }
  return body.result;
}

async function createCheckout({ slug, quantity }) {
  const res = await fetch(`${APP_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, quantity }),
  });
  const data = await res.json();
  if (!res.ok || !data.order) {
    throw new Error(data.error ?? `POST /api/orders failed for ${slug}`);
  }
  if (!data.order.depositAddress) {
    throw new Error(`order missing depositAddress: ${data.order.id}`);
  }
  if (data.order.amountMicro == null) {
    throw new Error(`order missing amountMicro: ${data.order.id}`);
  }
  return data.order;
}

async function waitUntilDetected(orderId) {
  for (let i = 0; i < 60; i += 1) {
    const res = await fetch(`${APP_URL}/api/orders/${orderId}`);
    const data = await res.json();
    if (!res.ok || !data.order) {
      throw new Error(data.error ?? `GET /api/orders/${orderId} failed`);
    }
    if (data.order.status === "paid") {
      if (data.order.txHash.toLowerCase() === demoTxHash(orderId).toLowerCase()) {
        throw new Error(`demo hash on an on-chain run: ${orderId}`);
      }
      return data.order;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`order ${orderId} did not become paid`);
}

function makeBuyer(privateKey) {
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL),
  });
  return {
    account,
    async sendUsdc(depositAddress, amountMicro) {
      const hash = await walletClient.writeContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "transfer",
        args: [depositAddress, BigInt(amountMicro)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
  };
}

async function fundFromWhale({ whale, buyers, usdcEach, ethEach }) {
  await rpc("anvil_setBalance", [whale, `0x${ethEach.toString(16)}`]);
  await rpc("anvil_impersonateAccount", [whale]);
  const whaleClient = createWalletClient({
    account: whale,
    chain: sepolia,
    transport: http(RPC_URL),
  });
  for (const buyer of buyers) {
    await rpc("anvil_setBalance", [
      buyer.account.address,
      `0x${ethEach.toString(16)}`,
    ]);
    const hash = await whaleClient.writeContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "transfer",
      args: [buyer.account.address, usdcEach],
    });
    await publicClient.waitForTransactionReceipt({ hash });
  }
}

function pickInStockSlug(products) {
  const inStock = products.filter((product) => product.available >= 1);
  if (inStock.length === 0) {
    throw new Error("no product with available >= 1");
  }
  return inStock[Math.floor(Math.random() * inStock.length)].slug;
}

async function listProducts() {
  const res = await fetch(`${APP_URL}/api/products`);
  const data = await res.json();
  if (!res.ok || !Array.isArray(data.products)) {
    throw new Error("GET /api/products failed");
  }
  return data.products;
}

async function main() {
  const chainId = await publicClient.getChainId();
  if (chainId !== 11155111) {
    throw new Error(`expected chain id 11155111, got ${chainId}`);
  }

  const buyers = Array.from({ length: BUYER_COUNT }, () =>
    makeBuyer(generatePrivateKey())
  );
  await fundFromWhale({
    whale: WHALE,
    buyers,
    usdcEach: USDC_EACH_MICRO,
    ethEach: ETH_EACH_WEI,
  });

  const deposits = new Set();
  const hashes = new Set();
  for (let i = 0; i < BUYER_COUNT; i += 1) {
    const buyer = buyers[i];
    const products = await listProducts();
    const slug = pickInStockSlug(products);
    const order = await createCheckout({ slug, quantity: 1 });
    if (deposits.has(order.depositAddress)) {
      throw new Error(`deposit reused: ${order.depositAddress}`);
    }
    deposits.add(order.depositAddress);

    const sentHash = await buyer.sendUsdc(
      order.depositAddress,
      order.amountMicro
    );
    const paid = await waitUntilDetected(order.id);
    if (paid.txHash.toLowerCase() !== sentHash.toLowerCase()) {
      throw new Error(
        `paid.txHash ${paid.txHash} !== sent ${sentHash} for ${order.id}`
      );
    }
    if (hashes.has(paid.txHash.toLowerCase())) {
      throw new Error(`tx hash reused: ${paid.txHash}`);
    }
    hashes.add(paid.txHash.toLowerCase());

    const againRes = await fetch(`${APP_URL}/api/orders/${order.id}`);
    const again = await againRes.json();
    if (again.order?.depositAddress !== order.depositAddress) {
      throw new Error(
        `depositAddress changed on second GET: ${order.depositAddress} -> ${again.order?.depositAddress}`
      );
    }

    console.log(slug, order.depositAddress, sentHash);
  }

  if (deposits.size !== BUYER_COUNT) {
    throw new Error(`expected ${BUYER_COUNT} deposits, got ${deposits.size}`);
  }
  if (hashes.size !== BUYER_COUNT) {
    throw new Error(`expected ${BUYER_COUNT} tx hashes, got ${hashes.size}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
