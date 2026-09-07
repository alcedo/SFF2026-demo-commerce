import { NextRequest, NextResponse } from "next/server";
import { fulfillOrder, getOrder, setOrderTxHash } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";
import { verifyUsdcPayment } from "@/lib/payment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const txHash = body.txHash as `0x${string}` | undefined;

  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ order: toPublicOrder(order) });
  }

  if (!txHash) {
    return NextResponse.json({ error: "Missing txHash" }, { status: 400 });
  }

  const verification = await verifyUsdcPayment({
    txHash,
    expectedAmountMicro: BigInt(order.amount_micro),
    buyerAddress: order.buyer_address ?? undefined,
  });

  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  setOrderTxHash(id, txHash);
  fulfillOrder(id);
  return NextResponse.json({ order: toPublicOrder(getOrder(id)!) });
}
