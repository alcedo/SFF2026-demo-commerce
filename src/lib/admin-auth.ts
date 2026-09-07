import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ADMIN_COOKIE, ADMIN_PASSWORD, ADMIN_USERNAME } from "./config";

export function adminToken(): string {
  return createHash("sha256")
    .update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:vouchershop`)
    .digest("hex");
}

function tokensEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function credentialsMatch(username: string, password: string): boolean {
  return (
    tokensEqual(username, ADMIN_USERNAME) &&
    tokensEqual(password, ADMIN_PASSWORD)
  );
}

export function isRequestAdmin(request: NextRequest): boolean {
  const header = request.headers.get("x-admin-password");
  if (header && tokensEqual(header, ADMIN_PASSWORD)) return true;
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  return Boolean(cookie && tokensEqual(cookie, adminToken()));
}

export async function isSessionAdmin(): Promise<boolean> {
  const jar = await cookies();
  const cookie = jar.get(ADMIN_COOKIE)?.value;
  return Boolean(cookie && tokensEqual(cookie, adminToken()));
}
