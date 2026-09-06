import { NextRequest, NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { getVoucherById } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const voucher = getVoucherById(Number(id));
  if (!voucher) {
    return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
  }
  return NextResponse.json({ voucher });
}
