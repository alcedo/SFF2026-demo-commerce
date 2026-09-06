"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";

const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

type Product = {
  id: number;
  name: string;
  description: string;
  priceUsdc: number;
};

type OrderResponse = {
  order: {
    id: string;
    amountUsdc: number;
    merchantAddress: string;
    usdcAddress: string;
    status: string;
  };
};

export default function CheckoutPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = Number(params.productId);
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const [product, setProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<OrderResponse["order"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    writeContract,
    data: txHash,
    isPending: isPaying,
    error: payError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const found = data.products.find((p: Product) => p.id === productId);
        setProduct(found ?? null);
      });
  }, [productId]);

  useEffect(() => {
    if (!isConfirmed || !order || !txHash) return;

    fetch(`/api/orders/${order.id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Verification failed");
        router.push(`/order/${order.id}`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Verification failed");
      });
  }, [isConfirmed, order, txHash, router]);

  async function createOrder() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, buyerAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create order");
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create order");
    } finally {
      setLoading(false);
    }
  }

  function payWithUsdc() {
    if (!order) return;
    writeContract({
      address: order.usdcAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "transfer",
      args: [
        order.merchantAddress as `0x${string}`,
        parseUnits(String(order.amountUsdc), 6),
      ],
    });
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-zinc-600">Loading product...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        Back to shop
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Checkout</h1>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <p className="mt-2 text-sm text-zinc-600">{product.description}</p>
        <p className="mt-4 text-2xl font-bold">{product.priceUsdc} USDC</p>
        <p className="mt-2 text-xs text-zinc-500">Sepolia testnet only</p>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold">1. Connect wallet</h3>
        {!isConnected ? (
          <button
            onClick={() => connect({ connector: connectors[0] })}
            disabled={isConnecting}
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect wallet"}
          </button>
        ) : (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-mono text-zinc-700">{address}</span>
            <button onClick={() => disconnect()} className="text-indigo-600">
              Disconnect
            </button>
          </div>
        )}
        {isConnected && chainId !== 11155111 && (
          <p className="mt-2 text-sm text-amber-700">
            Switch your wallet to Sepolia testnet.
          </p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold">2. Create order</h3>
        <button
          onClick={createOrder}
          disabled={!isConnected || loading || !!order}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {order ? "Order created" : loading ? "Creating..." : "Reserve voucher"}
        </button>
        {order && (
          <p className="mt-2 text-xs font-mono text-zinc-500">Order {order.id}</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold">3. Pay with USDC</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Send exactly {product.priceUsdc} USDC to the merchant wallet. Payment is
          verified on-chain.
        </p>
        <button
          onClick={payWithUsdc}
          disabled={!order || isPaying || isConfirming}
          className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPaying || isConfirming ? "Processing payment..." : "Pay with USDC"}
        </button>
        {txHash && (
          <p className="mt-2 break-all text-xs font-mono text-zinc-500">
            Tx: {txHash}
          </p>
        )}
      </div>

      {(error || payError) && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? payError?.message}
        </p>
      )}
    </div>
  );
}
