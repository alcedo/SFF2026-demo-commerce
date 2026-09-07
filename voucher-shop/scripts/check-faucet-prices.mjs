import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCALE = 0.001;
const FACES = {
  amazon: 25,
  netflix: 15,
  steam: 20,
  spotify: 10,
  "google-play": 25,
  apple: 25,
  xbox: 15,
  grab: 10,
  shopee: 20,
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function expectedUsd(face) {
  return face * SCALE;
}

function expectedMicro(face) {
  return Math.round(expectedUsd(face) * 1e6);
}

function parseCatalogValues(src) {
  const scaleMatch = src.match(/TESTNET_VALUE_SCALE\s*=\s*([0-9.]+)/);
  const scale = scaleMatch ? Number(scaleMatch[1]) : null;
  const values = {};
  const blockRe =
    /slug:\s*"([^"]+)"[\s\S]*?usdValue:\s*([0-9.]+)(\s*\*\s*TESTNET_VALUE_SCALE)?/g;
  for (const match of src.matchAll(blockRe)) {
    const slug = match[1];
    const raw = Number(match[2]);
    values[slug] = match[3] ? raw * (scale ?? Number.NaN) : raw;
  }
  return { scale, values };
}

function formatFromMicro(micro) {
  const sign = micro < 0 ? "-" : "";
  const abs = Math.abs(Number(micro));
  const whole = Math.trunc(abs / 1_000_000);
  const frac = String(abs % 1_000_000).padStart(6, "0").replace(/0+$/, "");
  return frac.length === 0 ? `${sign}${whole}` : `${sign}${whole}.${frac}`;
}

const catalogSrc = read("src/lib/catalog.ts");
const { scale, values } = parseCatalogValues(catalogSrc);

if (scale !== SCALE) {
  fail(`TESTNET_VALUE_SCALE must be ${SCALE}, got ${scale}`);
}

for (const [slug, face] of Object.entries(FACES)) {
  const got = values[slug];
  if (got !== expectedUsd(face)) {
    fail(`${slug} usdValue must be ${expectedUsd(face)}, got ${got}`);
  }
}

const extra = Object.keys(values).filter((slug) => !(slug in FACES));
if (extra.length) {
  fail(`unexpected catalog slugs: ${extra.join(", ")}`);
}

const dbSrc = read("src/lib/db.ts");
if (/SCHEMA_VERSION = "2"/.test(dbSrc)) {
  fail("SCHEMA_VERSION is still 2; bump it so existing DBs reseed scaled prices");
}
if (/usd_value INTEGER NOT NULL/.test(dbSrc)) {
  fail("products.usd_value is INTEGER and will truncate 0.025 to 0");
}

const configSrc = read("src/lib/config.ts");
if (/fromMicroUsdc\(micro\)\.toFixed\(2\)/.test(configSrc)) {
  fail("formatUsdc still uses toFixed(2), which prints 0.025 as 0.03");
}

const homeSrc = read("src/app/(store)/page.tsx");
if (/usdValue=\{25\}/.test(homeSrc) || /usdValue=\{15\}/.test(homeSrc)) {
  fail("homepage GiftCardArt still hardcodes full-size face values");
}

const checkoutSrc = read("src/app/(store)/checkout/[orderId]/page.tsx");
const successSrc = read("src/app/(store)/success/[orderId]/page.tsx");
if (checkoutSrc.includes("amountUsdc.toFixed(2)") || successSrc.includes("amountUsdc.toFixed(2)")) {
  fail("checkout or success still rounds the send amount with toFixed(2)");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("static catalog scale ok");
for (const [slug, face] of Object.entries(FACES)) {
  console.log(
    `${slug}: ${expectedUsd(face)} USDC (${expectedMicro(face)} micro, label ${formatFromMicro(expectedMicro(face))})`
  );
}

const appUrl = process.env.APP_URL;
if (!appUrl) {
  if (process.exitCode) process.exit(process.exitCode);
  console.log("skip live API check (set APP_URL to prove seeded prices)");
  process.exit(process.exitCode ?? 0);
}

const productsRes = await fetch(`${appUrl}/api/products`);
if (!productsRes.ok) {
  fail(`GET /api/products failed: ${productsRes.status}`);
  process.exit(1);
}
const { products } = await productsRes.json();
if (!Array.isArray(products) || products.length === 0) {
  fail("GET /api/products returned no products");
  process.exit(1);
}

for (const [slug, face] of Object.entries(FACES)) {
  const product = products.find((item) => item.slug === slug);
  if (!product) {
    fail(`API missing product ${slug}`);
    continue;
  }
  const wantMicro = expectedMicro(face);
  if (Math.round(product.usdValue * 1e6) !== wantMicro) {
    fail(`${slug} API usdValue must be ${expectedUsd(face)}, got ${product.usdValue}`);
  }
  if (Math.round(product.priceUsdc * 1e6) !== wantMicro) {
    fail(`${slug} API priceUsdc must be ${expectedUsd(face)}, got ${product.priceUsdc}`);
  }
}

const amazon = products.find((item) => item.slug === "amazon");
const orderRes = await fetch(`${appUrl}/api/orders`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ slug: "amazon", quantity: 3 }),
});
const orderData = await orderRes.json();
if (!orderRes.ok || !orderData.order) {
  fail(`POST /api/orders failed: ${orderData.error ?? orderRes.status}`);
} else {
  const wantMicro = expectedMicro(FACES.amazon) * 3;
  if (Math.round(orderData.order.amountUsdc * 1e6) !== wantMicro) {
    fail(`qty-3 amazon amountUsdc must be ${formatFromMicro(wantMicro)}, got ${orderData.order.amountUsdc}`);
  }
  const label = orderData.order.amountLabel ?? "";
  if (!label.startsWith(formatFromMicro(expectedMicro(FACES.amazon) * 3))) {
    fail(`qty-3 amazon amountLabel must start with ${formatFromMicro(expectedMicro(FACES.amazon) * 3)}, got ${label}`);
  }
  console.log(`live order ${orderData.order.id} amount ${orderData.order.amountUsdc} (${label})`);
}

if (amazon) {
  console.log(`live amazon ${amazon.priceUsdc} USDC`);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log("live API scale ok");
