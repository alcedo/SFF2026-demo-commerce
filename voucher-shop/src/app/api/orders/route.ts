import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  claimAvailableVoucher,
  createOrder,
  fulfillOrder,
  getOrder,
  getProduct,
  getVoucherByOrder,
  setOrderTxHash,
} from "@/lib/db";
import { verifyUsdcPayment } from "@/lib/payment";
import { fromMicroUsdc, MERCHANT_ADDRESS, USDC_ADDRESS } from "@/lib/config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const productId = Number(body.productId);
  const buyerAddress = body.buyerAddress as string | undefined;

  const product = getProduct(productId);
  if (!product || !product.active) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const available = claimAvailableVoucher(productId);
  if (!available) {
    return NextResponse.json(
      { error: "No vouchers in stock for this product" },
      { status: 409 }
    );
  }

  const orderId = randomUUID();
  const order = createOrder({
    id: orderId,
    productId,
    buyerAddress,
    amountMicro: product.price_micro,
    voucherId: available.id,
  });

  return NextResponse.json({
    order: {
      id: order.id,
      productId: order.product_id,
      amountUsdc: fromMicroUsdc(order.amount_micro),
      amountMicro: order.amount_micro,
      status: order.status,
      merchantAddress: MERCHANT_ADDRESS,
      usdcAddress: USDC_ADDRESS,
    },
  });
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

  const voucher = getVoucherByOrder(orderId);
  return NextResponse.json({
    order: {
      id: order.id,
      productId: order.product_id,
      amountUsdc: fromMicroUsdc(order.amount_micro),
      status: order.status,
      txHash: order.tx_hash,
      voucherCode: voucher?.code ?? null,
      merchantAddress: MERCHANT_ADDRESS,
      usdcAddress: USDC_ADDRESS,
    },
  });
}
