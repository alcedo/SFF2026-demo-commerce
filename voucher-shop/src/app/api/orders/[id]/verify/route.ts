import { NextRequest, NextResponse } from "next/server";
import {
  fulfillOrder,
  getOrder,
  getVoucherByOrder,
  setOrderTxHash,
} from "@/lib/db";
import { verifyUsdcPayment } from "@/lib/payment";
import { fromMicroUsdc } from "@/lib/config";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const txHash = body.txHash as `0x${string}` | undefined;

  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    const voucher = getVoucherByOrder(id);
    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        voucherCode: voucher?.code ?? null,
      },
    });
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
  const updated = getVoucherByOrder(id);

  return NextResponse.json({
    order: {
      id: order.id,
      status: "paid",
      amountUsdc: fromMicroUsdc(order.amount_micro),
      voucherCode: updated?.code ?? null,
      txHash,
    },
  });
}
