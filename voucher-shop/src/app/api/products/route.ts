import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db";
import { fromMicroUsdc } from "@/lib/config";

export async function GET() {
  const products = listProducts().map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    priceUsdc: fromMicroUsdc(p.price_micro),
    priceMicro: p.price_micro,
  }));
  return NextResponse.json({ products });
}
