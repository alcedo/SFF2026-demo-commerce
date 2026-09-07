const URL_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
];

function connectionString() {
  for (const key of URL_KEYS) {
    const url = process.env[key];
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
const onVercel = Boolean(process.env.VERCEL);
const query = process.argv.includes("--query");

if (!found) {
  if (onVercel) {
    console.error(
      "NEON_TEST failed: no DATABASE_URL (or Neon/Postgres alias) in the Vercel environment. Connect the Neon store to this project for Preview and Production."
    );
    process.exit(1);
  }
  console.log("NEON_TEST skipped: no database URL outside Vercel");
  process.exit(0);
}

console.log(`NEON_TEST env ok using=${found.key} host=${hostFromUrl(found.url)}`);

if (!query) {
  process.exit(0);
}

const { neon } = await import("@neondatabase/serverless");
try {
  const sql = neon(found.url);
  const rows = await sql`
    SELECT 1 AS connected, current_database() AS database, current_user AS db_user
  `;
  const row = rows[0];
  console.log(
    `NEON_TEST query ok database=${row.database} user=${row.db_user}`
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`NEON_TEST query failed: ${message}`);
  process.exit(1);
}
