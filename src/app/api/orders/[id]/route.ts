import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";
import { detectAndFulfill } from "@/lib/payment";

async function detectOrder(id: string) {
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  try {
    const updated = await detectAndFulfill(order);
    return NextResponse.json({ order: await toPublicOrder(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load order";
    const status = message.includes("MERCHANT_PRIVATE_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return detectOrder(id);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return detectOrder(id);
}
