import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PASSWORD } from "@/lib/config";
import {
  addVouchers,
  listAllProducts,
  listVouchers,
  redeemVoucher,
} from "@/lib/db";
import { fromMicroUsdc } from "@/lib/config";

function isAuthorized(request: NextRequest) {
  const auth = request.headers.get("x-admin-password");
  return auth === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = listAllProducts().map((p) => ({
    id: p.id,
    name: p.name,
    priceUsdc: fromMicroUsdc(p.price_micro),
  }));

  const vouchers = listVouchers();

  return NextResponse.json({ products, vouchers });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const productId = Number(body.productId);
  const codes = (body.codes as string[] | string) ?? [];

  const codeList = Array.isArray(codes)
    ? codes
    : String(codes)
        .split(/[\n,]/)
        .map((c) => c.trim())
        .filter(Boolean);

  if (!productId || codeList.length === 0) {
    return NextResponse.json(
      { error: "productId and codes are required" },
      { status: 400 }
    );
  }

  try {
    addVouchers(productId, codeList);
    return NextResponse.json({ added: codeList.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to add vouchers";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
