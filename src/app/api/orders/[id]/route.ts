import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";
import { detectAndFulfill } from "@/lib/payment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const updated = await detectAndFulfill(order);
  return NextResponse.json({ order: toPublicOrder(updated) });
}
