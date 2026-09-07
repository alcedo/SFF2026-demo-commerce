import { NextResponse } from "next/server";
import { expireOrder, getOrder } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";
import { detectAndFulfill } from "@/lib/payment";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  }

  const latest = await detectAndFulfill(order);
  if (latest.status === "paid") {
    return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  }

  await expireOrder(id);
  const expired = await getOrder(id);
  if (!expired) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order: await toPublicOrder(expired) });
}
