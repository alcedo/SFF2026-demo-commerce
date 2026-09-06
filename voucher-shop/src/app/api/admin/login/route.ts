import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/config";
import { adminToken, credentialsMatch } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  if (!credentialsMatch(username, password)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
