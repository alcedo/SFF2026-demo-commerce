import { createPublicClient, createWalletClient, http, parseAbi, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const RPC_URL = process.env.SEPOLIA_RPC_URL ?? "http://127.0.0.1:8545";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const WHALE = "0x93083f60f1877a6ba974d5ed88bb74943deb8390";
const buyerKey = process.env.TEST_BUYER_PRIVATE_KEY;

if (!buyerKey) {
  console.error("Set TEST_BUYER_PRIVATE_KEY");
  process.exit(1);
}

const buyer = privateKeyToAccount(buyerKey);
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });
const erc20Abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
]);

async function impersonate(address) {
  await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "anvil_impersonateAccount",
      params: [address],
    }),
  });
}

async function sendEth(from, to, amountEth) {
  await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "anvil_setBalance",
      params: [to, `0x${BigInt(Math.floor(amountEth * 1e18)).toString(16)}`],
    }),
  });
}

async function main() {
  await sendEth(null, buyer.address, 1);
  await sendEth(null, WHALE, 1);
  await impersonate(WHALE);

  const whaleClient = createWalletClient({
    account: WHALE,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const amount = parseUnits("100", 6);
  const hash = await whaleClient.writeContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [buyer.address, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const balance = await publicClient.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [buyer.address],
  });

  const eth = await publicClient.getBalance({ address: buyer.address });
  console.log("Funded buyer", buyer.address);
  console.log("ETH:", Number(eth) / 1e18);
  console.log("USDC:", Number(balance) / 1e6);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
