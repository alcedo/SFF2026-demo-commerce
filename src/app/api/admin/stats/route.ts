import { NextRequest, NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/admin-auth";
import { listRecentActivity, voucherStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    stats: await voucherStats(),
    recent: await listRecentActivity(),
  });
}
