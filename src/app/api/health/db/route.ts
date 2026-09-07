import { NextResponse } from "next/server";
import { DEMO_AUTO_PAY } from "@/lib/config";
import {
  databaseUrlPresence,
  getSql,
  hostFromDatabaseUrl,
  resolveDatabaseUrl,
} from "@/lib/neon";
import {
  merchantPrivateKeyConfigured,
  merchantPrivateKeySource,
} from "@/lib/order-deposit";
import { ensureNeonShop } from "@/lib/shop-neon";

export const dynamic = "force-dynamic";

export async function GET() {
  const present = databaseUrlPresence();
  const found = resolveDatabaseUrl();

  if (!found) {
    return NextResponse.json(
      {
        ok: false,
        store: "json",
        error: "No Neon connection string in the environment",
        present,
        merchantKey: merchantPrivateKeyConfigured(),
        merchantKeySource: merchantPrivateKeySource(),
        demoAutoPay: DEMO_AUTO_PAY,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    await ensureNeonShop();
    const sql = getSql();
    const rows = await sql`
      SELECT
        1 AS connected,
        current_database() AS database,
        current_user AS db_user,
        now()::text AS server_time,
        (SELECT COUNT(*)::int FROM products) AS products,
        (SELECT COUNT(*)::int FROM vouchers) AS vouchers
    `;
    const row = rows[0] as
      | {
          connected: number;
          database: string;
          db_user: string;
          server_time: string;
          products: number;
          vouchers: number;
        }
      | undefined;
    return NextResponse.json(
      {
        ok: true,
        store: "neon",
        using: found.key,
        host: hostFromDatabaseUrl(found.url),
        database: row?.database,
        dbUser: row?.db_user,
        serverTime: row?.server_time,
        products: row?.products,
        vouchers: row?.vouchers,
        present,
        merchantKey: merchantPrivateKeyConfigured(),
        merchantKeySource: merchantPrivateKeySource(),
        demoAutoPay: DEMO_AUTO_PAY,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        store: "neon",
        using: found.key,
        host: hostFromDatabaseUrl(found.url),
        error: error instanceof Error ? error.message : "Neon query failed",
        present,
        merchantKey: merchantPrivateKeyConfigured(),
        merchantKeySource: merchantPrivateKeySource(),
        demoAutoPay: DEMO_AUTO_PAY,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
