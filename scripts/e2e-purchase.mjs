import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const buyerKey = process.env.TEST_BUYER_PRIVATE_KEY;
const merchantAddress = process.env.MERCHANT_ADDRESS;

if (!buyerKey || !merchantAddress) {
  console.error("Set TEST_BUYER_PRIVATE_KEY and MERCHANT_ADDRESS in .env.local");
  process.exit(1);
}

const account = privateKeyToAccount(buyerKey);
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(RPC_URL),
});

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

async function main() {
  const productRes = await fetch(`${APP_URL}/api/products`);
  const { products } = await productRes.json();
  const product = products.find((item) => item.slug === "amazon") ?? products[0];
  if (!product) throw new Error("No products available");

  const orderRes = await fetch(`${APP_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: product.id,
      quantity: 1,
      buyerAddress: account.address,
    }),
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) throw new Error(orderData.error ?? "Order creation failed");
  const order = orderData.order;
  console.log("Order created:", order.id);

  const amount = parseUnits(String(order.amountUsdc), 6);
  const balance = await publicClient.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("Buyer USDC balance:", Number(balance) / 1e6);
  if (balance < amount) {
    throw new Error(
      `Insufficient USDC. Fund ${account.address} with test USDC on Sepolia.`
    );
  }

  const hash = await walletClient.writeContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [merchantAddress, amount],
  });
  console.log("Payment tx:", hash);

  const verifyRes = await fetch(`${APP_URL}/api/orders/${order.id}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash: hash }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verify failed");

  console.log("Purchase successful!");
  const codes = verifyData.order.voucherCodes ?? [];
  console.log("Voucher codes:", codes.join(", "));
  const voucherCode = codes[0];
  if (!voucherCode) throw new Error("No voucher code returned");

  const redeemRes = await fetch(`${APP_URL}/api/vouchers/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: voucherCode }),
  });
  const redeemData = await redeemRes.json();
  if (!redeemRes.ok) throw new Error(redeemData.error ?? "Redeem failed");
  console.log("Redeem successful");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
