import { NextRequest, NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import {
  addVouchers,
  listAllProducts,
  listVouchers,
} from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get("status") ?? "all";
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({
    products: await Promise.all((await listAllProducts()).map(toPublicProduct)),
    vouchers: await listVouchers({ status, query }),
  });
}

export async function POST(request: NextRequest) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  const productId = Number(body.productId);
  const codes = (body.codes as string[] | string) ?? [];
  const codeList = Array.isArray(codes)
    ? codes
    : String(codes)
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);

  if (!productId || codeList.length === 0) {
    return NextResponse.json(
      { error: "productId and codes are required" },
      { status: 400 }
    );
  }

  try {
    await addVouchers(productId, codeList);
    return NextResponse.json({ added: codeList.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add vouchers";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
