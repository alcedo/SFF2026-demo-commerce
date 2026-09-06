import { NextRequest, NextResponse } from "next/server";
import { redeemVoucher } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const code = String(body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const result = redeemVoucher(code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
