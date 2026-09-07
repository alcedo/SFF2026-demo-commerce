import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
] as const;

const PRESENCE_KEYS = [
  ...URL_KEYS,
  "PGHOST",
  "PGHOST_UNPOOLED",
  "PGUSER",
  "PGDATABASE",
  "PGPASSWORD",
  "POSTGRES_HOST",
  "POSTGRES_USER",
  "POSTGRES_DATABASE",
  "POSTGRES_PASSWORD",
  "NEON_PROJECT_ID",
] as const;

function connectionString(): { key: (typeof URL_KEYS)[number]; url: string } | undefined {
  for (const key of URL_KEYS) {
    const url = process.env[key];
    if (url) return { key, url };
  }
  return undefined;
}

function hostFromUrl(url: string): string | null {
  const at = url.lastIndexOf("@");
  if (at === -1) return null;
  const hostPort = url.slice(at + 1).split(/[/?#]/)[0];
  return hostPort.split(":")[0] || null;
}

export async function GET() {
  const present = Object.fromEntries(
    PRESENCE_KEYS.map((key) => [key, Boolean(process.env[key])])
  );
  const found = connectionString();

  if (!found) {
    return NextResponse.json(
      {
        ok: false,
        error: "No Neon connection string in the environment",
        present,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const sql = neon(found.url);
    const rows = await sql`
      SELECT
        1 AS connected,
        current_database() AS database,
        current_user AS db_user,
        now()::text AS server_time,
        version() AS version
    `;
    const row = rows[0] as
      | {
          connected: number;
          database: string;
          db_user: string;
          server_time: string;
          version: string;
        }
      | undefined;
    return NextResponse.json(
      {
        ok: true,
        using: found.key,
        host: hostFromUrl(found.url),
        database: row?.database,
        dbUser: row?.db_user,
        serverTime: row?.server_time,
        version: row?.version,
        present,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        using: found.key,
        host: hostFromUrl(found.url),
        error: error instanceof Error ? error.message : "Neon query failed",
        present,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
