import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db";
import { toPublicProduct } from "@/lib/order-view";

export async function GET() {
  return NextResponse.json({
    products: listProducts().map(toPublicProduct),
  });
}
