import { neon } from "@neondatabase/serverless";

const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
];

function connectionString() {
  for (const key of URL_KEYS) {
    const url = process.env[key]?.trim();
    if (url) return { key, url };
  }
  return undefined;
}

function hostFromUrl(url) {
  const at = url.lastIndexOf("@");
  if (at === -1) return null;
  const hostPort = url.slice(at + 1).split(/[/?#]/)[0];
  return hostPort.split(":")[0] || null;
}

const found = connectionString();

if (!found) {
  console.log("db:ping skipped: no DATABASE_URL");
  process.exit(0);
}

try {
  const sql = neon(found.url);
  const rows = await sql`
    SELECT 1 AS connected, current_database() AS database, current_user AS db_user
  `;
  const row = rows[0];
  console.log(
    `db:ping ok using=${found.key} database=${row.database} user=${row.db_user} host=${hostFromUrl(found.url)}`
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`db:ping failed: ${message}`);
  process.exit(1);
}
