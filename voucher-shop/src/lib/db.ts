import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "vouchers.db");

const globalForDb = globalThis as typeof globalThis & {
  __voucherDb?: Database.Database;
};

function createDb() {
  const database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_micro INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      buyer_address TEXT,
      amount_micro INTEGER NOT NULL,
      tx_hash TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      voucher_id INTEGER,
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

  const productCount = database
    .prepare("SELECT COUNT(*) as count FROM products")
    .get() as { count: number };

  if (productCount.count === 0) {
    database
      .prepare(
        `INSERT INTO products (name, description, price_micro) VALUES (?, ?, ?)`
      )
      .run(
        "Premium Gift Voucher",
        "Redeem for $10 off your next purchase at partner stores.",
        1_000_000
      );
    database
      .prepare(
        `INSERT INTO products (name, description, price_micro) VALUES (?, ?, ?)`
      )
      .run(
        "Deluxe Gift Voucher",
        "Redeem for $25 off your next purchase at partner stores.",
        2_500_000
      );

    const seedCodes = [
      { productId: 1, codes: ["GIFT-10-ALPHA", "GIFT-10-BRAVO", "GIFT-10-CHARLIE"] },
      { productId: 2, codes: ["GIFT-25-DELTA", "GIFT-25-ECHO", "GIFT-25-FOXTROT"] },
    ];

    const insertVoucher = database.prepare(
      `INSERT INTO vouchers (product_id, code) VALUES (?, ?)`
    );
    for (const group of seedCodes) {
      for (const code of group.codes) {
        insertVoucher.run(group.productId, code);
      }
    }
  }

  return database;
}

export const db = globalForDb.__voucherDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__voucherDb = db;
}

export type Product = {
  id: number;
  name: string;
  description: string;
  price_micro: number;
  active: number;
  created_at: string;
};

export type Order = {
  id: string;
  product_id: number;
  buyer_address: string | null;
  amount_micro: number;
  tx_hash: string | null;
  status: "pending" | "paid" | "expired";
  voucher_id: number | null;
  created_at: string;
  paid_at: string | null;
};

export type Voucher = {
  id: number;
  product_id: number;
  code: string;
  status: "available" | "reserved" | "sold" | "used";
  order_id: string | null;
  sold_at: string | null;
  used_at: string | null;
  created_at: string;
};

export function listProducts(): Product[] {
  return db
    .prepare("SELECT * FROM products WHERE active = 1 ORDER BY price_micro ASC")
    .all() as Product[];
}

export function getProduct(id: number): Product | undefined {
  return db.prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | Product
    | undefined;
}

export function createOrder(input: {
  id: string;
  productId: number;
  buyerAddress?: string;
  amountMicro: number;
  voucherId: number;
}): Order {
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (id, product_id, buyer_address, amount_micro, voucher_id) VALUES (?, ?, ?, ?, ?)`
    ).run(
      input.id,
      input.productId,
      input.buyerAddress ?? null,
      input.amountMicro,
      input.voucherId
    );
    db.prepare(
      `UPDATE vouchers SET order_id = ?, status = 'reserved' WHERE id = ? AND status = 'available'`
    ).run(input.id, input.voucherId);
  });
  tx();
  return getOrder(input.id)!;
}

export function getOrder(id: string): Order | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | Order
    | undefined;
}

export function setOrderTxHash(id: string, txHash: string) {
  db.prepare("UPDATE orders SET tx_hash = ? WHERE id = ?").run(txHash, id);
}

export function fulfillOrder(orderId: string) {
  const now = new Date().toISOString();
  const order = getOrder(orderId);
  if (!order?.voucher_id) return;
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE orders SET status = 'paid', paid_at = ? WHERE id = ?`
    ).run(now, orderId);
    db.prepare(
      `UPDATE vouchers SET status = 'sold', sold_at = ? WHERE id = ?`
    ).run(now, order.voucher_id);
  });
  tx();
}

export function claimAvailableVoucher(productId: number): Voucher | undefined {
  return db
    .prepare(
      `SELECT * FROM vouchers WHERE product_id = ? AND status = 'available' ORDER BY id ASC LIMIT 1`
    )
    .get(productId) as Voucher | undefined;
}

export function getVoucherByOrder(orderId: string): Voucher | undefined {
  return db
    .prepare("SELECT * FROM vouchers WHERE order_id = ?")
    .get(orderId) as Voucher | undefined;
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

export function listVouchers() {
  return db
    .prepare(
      `SELECT v.*, p.name as product_name FROM vouchers v
       JOIN products p ON p.id = v.product_id
       ORDER BY v.id DESC`
    )
    .all();
}

export function listAllProducts(): Product[] {
  return db
    .prepare("SELECT * FROM products ORDER BY id ASC")
    .all() as Product[];
}

export function redeemVoucher(code: string): { ok: true } | { ok: false; error: string } {
  const voucher = getVoucherByCode(code);
  if (!voucher) return { ok: false, error: "Voucher not found" };
  if (voucher.status === "available") {
    return { ok: false, error: "Voucher has not been purchased yet" };
  }
  if (voucher.status === "used") {
    return { ok: false, error: "Voucher already redeemed" };
  }
  db.prepare(
    `UPDATE vouchers SET status = 'used', used_at = datetime('now') WHERE id = ?`
  ).run(voucher.id);
  return { ok: true };
}
