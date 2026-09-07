import { NextResponse } from "next/server";
import { isSessionAdmin } from "@/lib/admin-auth";

export async function GET() {
  const ok = await isSessionAdmin();
  if (!ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
