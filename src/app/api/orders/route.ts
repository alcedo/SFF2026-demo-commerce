import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrder, getProduct, getProductBySlug } from "@/lib/db";
import { toPublicOrder } from "@/lib/order-view";
import { reconcileAgedInvoices } from "@/lib/payment";

export const maxDuration = 15;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const quantity = Number(body.quantity ?? 1);
  const product =
    typeof body.slug === "string"
      ? await getProductBySlug(body.slug)
      : await getProduct(Number(body.productId));

  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    await reconcileAgedInvoices();
    const order = await createOrder({
      productId: product.id,
      quantity,
      buyerAddress:
        typeof body.buyerAddress === "string" ? body.buyerAddress : undefined,
    });
    return NextResponse.json({ order: await toPublicOrder(order) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order";
    const status = message.includes("stock")
      ? 409
      : message.includes("MERCHANT_PRIVATE_KEY")
        ? 503
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("id");
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }
  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  try {
    return NextResponse.json({ order: await toPublicOrder(order) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load order";
    const status = message.includes("MERCHANT_PRIVATE_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
