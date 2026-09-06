import { createPublicClient, http, parseAbiItem } from "viem";
import { CHAIN, MERCHANT_ADDRESS, RPC_URL, USDC_ADDRESS } from "./config";

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
      const to = log.args.to?.toLowerCase();
      const from = log.args.from?.toLowerCase();
      const value = log.args.value;
      if (to !== MERCHANT_ADDRESS.toLowerCase()) return false;
      if (value !== input.expectedAmountMicro) return false;
      if (
        input.buyerAddress &&
        from !== input.buyerAddress.toLowerCase()
      ) {
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
