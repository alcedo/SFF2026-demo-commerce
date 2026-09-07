import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
] as const;

export const DATABASE_PRESENCE_KEYS = [
  ...DATABASE_URL_KEYS,
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

export type DatabaseUrlKey = (typeof DATABASE_URL_KEYS)[number];

export function databaseUrlPresence(): Record<string, boolean> {
  return Object.fromEntries(
    DATABASE_PRESENCE_KEYS.map((key) => [key, Boolean(process.env[key])])
  );
}

export function resolveDatabaseUrl():
  | { key: DatabaseUrlKey; url: string }
  | undefined {
  for (const key of DATABASE_URL_KEYS) {
    const url = process.env[key]?.trim();
    if (url) return { key, url };
  }
  return undefined;
}

export function hostFromDatabaseUrl(url: string): string | null {
  const at = url.lastIndexOf("@");
  if (at === -1) return null;
  const hostPort = url.slice(at + 1).split(/[/?#]/)[0];
  return hostPort.split(":")[0] || null;
}

type Sql = NeonQueryFunction<false, false>;

const globalForNeon = globalThis as typeof globalThis & {
  __voucherShopSql?: Sql;
};

function createSql(): Sql {
  const found = resolveDatabaseUrl();
  if (!found) {
    throw new Error("DATABASE_URL is not set");
  }
  return neon(found.url);
}

export function getSql(): Sql {
  if (!globalForNeon.__voucherShopSql) {
    globalForNeon.__voucherShopSql = createSql();
  }
  return globalForNeon.__voucherShopSql;
}
