import { NextRequest, NextResponse } from "next/server";
import {
  createOrder,
  expireAgedInvoices,
  getOrder,
  getProduct,
  getProductBySlug,
} from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const quantity = Number(body.quantity ?? 1);
  const product =
    typeof body.slug === "string"
      ? getProductBySlug(body.slug)
      : getProduct(Number(body.productId));

  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    // Free aged reservations without Sepolia getLogs. On-chain detect stays on
    // GET /api/orders/[id] (after the response) and POST verify.
    expireAgedInvoices();
    const order = createOrder({
      productId: product.id,
      quantity,
      buyerAddress:
        typeof body.buyerAddress === "string" ? body.buyerAddress : undefined,
    });
    return NextResponse.json({ order: toPublicOrder(order) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order";
    const status = message.includes("stock") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("id");
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  const order = getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order: toPublicOrder(order) });
}
