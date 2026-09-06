import Database from "better-sqlite3";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { CATALOG } from "./catalog";
import { toMicroUsdc } from "./config";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "vouchers.db");
const SCHEMA_VERSION = "2";

const globalForDb = globalThis as typeof globalThis & {
  __voucherDb?: Database.Database;
};

export type Product = {
  id: number;
  slug: string;
  brand: string;
  name: string;
  description: string;
  category: string;
  usd_value: number;
  price_micro: number;
  theme: string;
  active: number;
  created_at: string;
};

export type Order = {
  id: string;
  product_id: number;
  quantity: number;
  buyer_address: string | null;
  amount_micro: number;
  tx_hash: string | null;
  status: "pending" | "paid" | "expired";
  created_at: string;
  paid_at: string | null;
};

export type VoucherStatus = "available" | "reserved" | "sold" | "used" | "expired";

export type Voucher = {
  id: number;
  product_id: number;
  code: string;
  status: VoucherStatus;
  order_id: string | null;
  sold_at: string | null;
  used_at: string | null;
  created_at: string;
};

export type VoucherRow = Voucher & {
  product_name: string;
  brand: string;
  usd_value: number;
  tx_hash: string | null;
  order_status: string | null;
};

function voucherCode(seed: string): string {
  const hex = createHash("sha256").update(seed).digest("hex").slice(0, 16).toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function createDb() {
  const database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const version = database
    .prepare("SELECT value FROM meta WHERE key = 'schema'")
    .get() as { value: string } | undefined;

  if (version?.value !== SCHEMA_VERSION) {
    database.exec(`
      DROP TABLE IF EXISTS vouchers;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS products;
    `);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      usd_value INTEGER NOT NULL,
      price_micro INTEGER NOT NULL,
      theme TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      buyer_address TEXT,
      amount_micro INTEGER NOT NULL,
      tx_hash TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      paid_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'available',
      order_id TEXT,
      sold_at TEXT,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  database
    .prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema', ?)")
    .run(SCHEMA_VERSION);

  const productCount = database
    .prepare("SELECT COUNT(*) as count FROM products")
    .get() as { count: number };

  if (productCount.count === 0) {
    const insertProduct = database.prepare(
      `INSERT INTO products (slug, brand, name, description, category, usd_value, price_micro, theme)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertVoucher = database.prepare(
      `INSERT INTO vouchers (product_id, code, status, used_at) VALUES (?, ?, ?, ?)`
    );

    const seed = database.transaction(() => {
      for (const item of CATALOG) {
        const result = insertProduct.run(
          item.slug,
          item.brand,
          item.name,
          item.description,
          item.category,
          item.usdValue,
          Number(toMicroUsdc(item.usdValue)),
          item.theme
        );
        const productId = Number(result.lastInsertRowid);
        for (let i = 0; i < 12; i += 1) {
          insertVoucher.run(
            productId,
            voucherCode(`${item.slug}:${i}`),
            "available",
            null
          );
        }
      }

      const amazon = database
        .prepare("SELECT id FROM products WHERE slug = 'amazon'")
        .get() as { id: number };
      const netflix = database
        .prepare("SELECT id FROM products WHERE slug = 'netflix'")
        .get() as { id: number };

      insertVoucher.run(
        amazon.id,
        voucherCode("amazon:used"),
        "used",
        new Date().toISOString()
      );
      insertVoucher.run(netflix.id, voucherCode("netflix:expired"), "expired", null);
    });
    seed();
  }

  return database;
}

export const db = globalForDb.__voucherDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__voucherDb = db;
}

export function listProducts(): Product[] {
  return db
    .prepare("SELECT * FROM products WHERE active = 1 ORDER BY id ASC")
    .all() as Product[];
}

export function listAllProducts(): Product[] {
  return db.prepare("SELECT * FROM products ORDER BY id ASC").all() as Product[];
}

export function getProduct(id: number): Product | undefined {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | Product
    | undefined;
}

export function getProductBySlug(slug: string): Product | undefined {
  return db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as
    | Product
    | undefined;
}

export function countAvailable(productId: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM vouchers WHERE product_id = ? AND status = 'available'`
    )
    .get(productId) as { count: number };
  return row.count;
}

export function createOrder(input: {
  id: string;
  productId: number;
  quantity: number;
  buyerAddress?: string;
}): Order {
  const product = getProduct(input.productId);
  if (!product) {
    throw new Error("Product not found");
  }
  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const run = db.transaction(() => {
    const available = db
      .prepare(
        `SELECT id FROM vouchers WHERE product_id = ? AND status = 'available' ORDER BY id ASC LIMIT ?`
      )
      .all(input.productId, quantity) as { id: number }[];
    if (available.length < quantity) {
      throw new Error("Not enough vouchers in stock");
    }
    db.prepare(
      `INSERT INTO orders (id, product_id, quantity, buyer_address, amount_micro)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      input.id,
      input.productId,
      quantity,
      input.buyerAddress ?? null,
      product.price_micro * quantity
    );
    const reserve = db.prepare(
      `UPDATE vouchers SET order_id = ?, status = 'reserved' WHERE id = ? AND status = 'available'`
    );
    for (const row of available) {
      const result = reserve.run(input.id, row.id);
      if (result.changes !== 1) {
        throw new Error("Could not reserve voucher");
      }
    }
  });
  run();
  return getOrder(input.id)!;
}

export function getOrder(id: string): Order | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | Order
    | undefined;
}

export function findPendingOrderByTxHash(txHash: string): Order | undefined {
  return db
    .prepare("SELECT * FROM orders WHERE tx_hash = ?")
    .get(txHash) as Order | undefined;
}

export function findOldestPendingForAmount(amountMicro: number): Order | undefined {
  return db
    .prepare(
      `SELECT * FROM orders
       WHERE status = 'pending' AND amount_micro = ? AND tx_hash IS NULL
       ORDER BY created_at ASC LIMIT 1`
    )
    .get(amountMicro) as Order | undefined;
}

export function setOrderTxHash(id: string, txHash: string) {
  db.prepare("UPDATE orders SET tx_hash = ? WHERE id = ? AND tx_hash IS NULL").run(
    txHash,
    id
  );
}

export function fulfillOrder(orderId: string) {
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(`UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?`).run(
      now,
      orderId
    );
    db.prepare(
      `UPDATE vouchers SET status = 'sold', sold_at = ? WHERE order_id = ? AND status = 'reserved'`
    ).run(now, orderId);
  });
  tx();
}

export function getVouchersByOrder(orderId: string): Voucher[] {
  return db
    .prepare("SELECT * FROM vouchers WHERE order_id = ? ORDER BY id ASC")
    .all(orderId) as Voucher[];
}

export function getVoucherById(id: number): VoucherRow | undefined {
  return db
    .prepare(
      `SELECT v.*, p.name as product_name, p.brand, p.usd_value,
              o.tx_hash, o.status as order_status
       FROM vouchers v
       JOIN products p ON p.id = v.product_id
       LEFT JOIN orders o ON o.id = v.order_id
       WHERE v.id = ?`
    )
    .get(id) as VoucherRow | undefined;
}

export function getVoucherByCode(code: string): Voucher | undefined {
  return db.prepare("SELECT * FROM vouchers WHERE code = ?").get(code) as
    | Voucher
    | undefined;
}

export function addVouchers(productId: number, codes: string[]) {
  const insert = db.prepare(
    `INSERT INTO vouchers (product_id, code) VALUES (?, ?)`
  );
  const tx = db.transaction((items: string[]) => {
    for (const code of items) {
      insert.run(productId, code.trim());
    }
  });
  tx(codes.filter((c) => c.trim().length > 0));
}

export function listVouchers(filter?: { status?: string; query?: string }): VoucherRow[] {
  const clauses: string[] = [];
  const params: string[] = [];
  if (filter?.status && filter.status !== "all") {
    clauses.push("v.status = ?");
    params.push(filter.status);
  }
  if (filter?.query) {
    clauses.push(
      "(v.code LIKE ? OR p.name LIKE ? OR p.brand LIKE ? OR IFNULL(v.order_id, '') LIKE ?)"
    );
    const like = `%${filter.query}%`;
    params.push(like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db
    .prepare(
      `SELECT v.*, p.name as product_name, p.brand, p.usd_value,
              o.tx_hash, o.status as order_status
       FROM vouchers v
       JOIN products p ON p.id = v.product_id
       LEFT JOIN orders o ON o.id = v.order_id
       ${where}
       ORDER BY v.id DESC`
    )
    .all(...params) as VoucherRow[];
}

export function voucherStats() {
  const row = db
    .prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
         SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used,
         SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired
       FROM vouchers`
    )
    .get() as {
    total: number;
    available: number;
    used: number;
    expired: number;
  };
  return {
    total: row.total ?? 0,
    available: row.available ?? 0,
    used: row.used ?? 0,
    expired: row.expired ?? 0,
  };
}

export function listRecentActivity(limit = 8): VoucherRow[] {
  return db
    .prepare(
      `SELECT v.*, p.name as product_name, p.brand, p.usd_value,
              o.tx_hash, o.status as order_status
       FROM vouchers v
       JOIN products p ON p.id = v.product_id
       LEFT JOIN orders o ON o.id = v.order_id
       WHERE v.status IN ('sold', 'used', 'reserved')
       ORDER BY COALESCE(v.used_at, v.sold_at, v.created_at) DESC
       LIMIT ?`
    )
    .all(limit) as VoucherRow[];
}

export function isTxHashUsed(txHash: string): boolean {
  const row = db
    .prepare("SELECT id FROM orders WHERE tx_hash = ?")
    .get(txHash) as { id: string } | undefined;
  return Boolean(row);
}

export function redeemVoucher(
  code: string
): { ok: true } | { ok: false; error: string } {
  const voucher = getVoucherByCode(code);
  if (!voucher) return { ok: false, error: "Voucher not found" };
  if (voucher.status === "available" || voucher.status === "reserved") {
    return { ok: false, error: "Voucher has not been purchased yet" };
  }
  if (voucher.status === "used") {
    return { ok: false, error: "Voucher already redeemed" };
  }
  if (voucher.status === "expired") {
    return { ok: false, error: "Voucher has expired" };
  }
  db.prepare(
    `UPDATE vouchers SET status = 'used', used_at = datetime('now') WHERE id = ?`
  ).run(voucher.id);
  return { ok: true };
}
