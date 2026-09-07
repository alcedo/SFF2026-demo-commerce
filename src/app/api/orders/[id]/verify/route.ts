import { NextRequest, NextResponse } from "next/server";
import { verifyPostedPayment } from "@/lib/deposit";
import { getOrder } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";

function parseTxHash(value: unknown): `0x${string}` | null {
  if (typeof value !== "string") return null;
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) return null;
  return value as `0x${string}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const txHash = parseTxHash(body.txHash);

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

  const verification = await verifyPostedPayment({ order, txHash });
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  return NextResponse.json({ order: toPublicOrder(getOrder(id)!) });
}
