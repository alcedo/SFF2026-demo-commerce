import fs from "fs";
import path from "path";
import { CATALOG } from "./catalog";
import { DEMO_AUTO_PAY, DEMO_AUTO_PAY_MS, ORDER_TTL_MS, fromMicroUsdc, toMicroUsdc } from "./config";
import {
  allocateHdIndex,
  heldDerivationIndices,
  MERCHANT_KEY_ERROR,
  merchantPrivateKeyConfigured,
} from "./order-deposit";
import { resolveDatabaseUrl } from "./neon";
import {
  demoTxHash,
  issueOrderToken,
  parseOrderToken,
  voucherCode,
} from "./order-token";
import * as neonShop from "./shop-neon";

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
  derivation_index: number;
  tx_hash: string | null;
  status: "pending" | "paid" | "expired";
  created_at: string;
  paid_at: string | null;
};

export type VoucherStatus =
  | "available"
  | "reserved"
  | "sold"
  | "used"
  | "expired";

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

type ShopState = {
  products: Product[];
  orders: Order[];
  vouchers: Voucher[];
  nextVoucherId: number;
};

const globalForShop = globalThis as typeof globalThis & {
  __voucherShop?: ShopState;
};

const LOCAL_STATE_FILE = path.join(process.cwd(), "data", "vouchershop.json");
const VERCEL_STATE_FILE = "/tmp/vouchershop.json";

function persistPath(): string {
  return process.env.VERCEL ? VERCEL_STATE_FILE : LOCAL_STATE_FILE;
}

function seedState(): ShopState {
  const now = new Date().toISOString();
  const products: Product[] = CATALOG.map((item, index) => ({
    id: index + 1,
    slug: item.slug,
    brand: item.brand,
    name: item.name,
    description: item.description,
    category: item.category,
    usd_value: fromMicroUsdc(toMicroUsdc(item.usdValue)),
    price_micro: Number(toMicroUsdc(item.usdValue)),
    theme: item.theme,
    active: 1,
    created_at: now,
  }));

  const vouchers: Voucher[] = [];
  let nextVoucherId = 1;
  for (const product of products) {
    for (let i = 0; i < 12; i += 1) {
      vouchers.push({
        id: nextVoucherId,
        product_id: product.id,
        code: voucherCode(`${product.slug}:${i}`),
        status: "available",
        order_id: null,
        sold_at: null,
        used_at: null,
        created_at: now,
      });
      nextVoucherId += 1;
    }
  }

  const amazon = products.find((product) => product.slug === "amazon");
  const netflix = products.find((product) => product.slug === "netflix");
  if (amazon) {
    vouchers.push({
      id: nextVoucherId,
      product_id: amazon.id,
      code: voucherCode("amazon:used"),
      status: "used",
      order_id: null,
      sold_at: null,
      used_at: now,
      created_at: now,
    });
    nextVoucherId += 1;
  }
  if (netflix) {
    vouchers.push({
      id: nextVoucherId,
      product_id: netflix.id,
      code: voucherCode("netflix:expired"),
      status: "expired",
      order_id: null,
      sold_at: null,
      used_at: null,
      created_at: now,
    });
    nextVoucherId += 1;
  }

  return { products, orders: [], vouchers, nextVoucherId };
}

function tryReadSnapshot(): ShopState | undefined {
  const file = persistPath();
  try {
    if (!fs.existsSync(/* turbopackIgnore: true */ file)) return undefined;
    return JSON.parse(
      fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")
    ) as ShopState;
  } catch {
    return undefined;
  }
}

function tryWriteSnapshot(state: ShopState): boolean {
  const file = persistPath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function usingNeon() {
  return Boolean(resolveDatabaseUrl());
}

function applyCatalogPrices(state: ShopState) {
  for (const product of state.products) {
    const item = CATALOG.find((entry) => entry.slug === product.slug);
    if (!item) continue;
    product.usd_value = fromMicroUsdc(toMicroUsdc(item.usdValue));
    product.price_micro = Number(toMicroUsdc(item.usdValue));
  }
}

function loadState(): ShopState {
  if (globalForShop.__voucherShop) {
    applyCatalogPrices(globalForShop.__voucherShop);
    return globalForShop.__voucherShop;
  }
  const snapshot = tryReadSnapshot();
  if (snapshot) {
    applyCatalogPrices(snapshot);
    globalForShop.__voucherShop = snapshot;
    return snapshot;
  }
  const seeded = seedState();
  writeState(seeded);
  return seeded;
}

function writeState(state: ShopState) {
  globalForShop.__voucherShop = state;
  tryWriteSnapshot(state);
}

function mutate(fn: (state: ShopState) => void) {
  const state = loadState();
  fn(state);
  writeState(state);
}

function toRow(voucher: Voucher, state: ShopState): VoucherRow {
  const product = state.products.find((item) => item.id === voucher.product_id);
  const order = voucher.order_id
    ? state.orders.find((item) => item.id === voucher.order_id)
    : undefined;
  return {
    ...voucher,
    product_name: product?.name ?? "",
    brand: product?.brand ?? "",
    usd_value: product?.usd_value ?? 0,
    tx_hash: order?.tx_hash ?? null,
    order_status: order?.status ?? null,
  };
}

function shouldAutoPay(order: Order): boolean {
  if (!DEMO_AUTO_PAY || order.status === "paid") return false;
  const createdMs = Date.parse(
    order.created_at.includes("T")
      ? order.created_at
      : `${order.created_at.replace(" ", "T")}Z`
  );
  return Number.isFinite(createdMs) && Date.now() - createdMs >= DEMO_AUTO_PAY_MS;
}

function attachDerivedVouchers(state: ShopState, order: Order) {
  const existing = state.vouchers.filter((voucher) => voucher.order_id === order.id);
  if (existing.length >= order.quantity) return;
  const now = order.created_at;
  const paid = order.status === "paid";
  for (let i = existing.length; i < order.quantity; i += 1) {
    state.vouchers.push({
      id: state.nextVoucherId,
      product_id: order.product_id,
      code: voucherCode(`${order.id}:${i}`),
      status: paid ? "sold" : "reserved",
      order_id: order.id,
      sold_at: paid ? order.paid_at : null,
      used_at: null,
      created_at: now,
    });
    state.nextVoucherId += 1;
  }
}

function synthesizeOrder(id: string): Order | undefined {
  const claims = parseOrderToken(id);
  if (!claims) return undefined;
  const product = loadState().products.find((item) => item.slug === claims.slug);
  if (!product) return undefined;
  const created_at = new Date(claims.createdAtMs).toISOString();
  const aged = Date.now() - claims.createdAtMs >= ORDER_TTL_MS;
  const order: Order = {
    id,
    product_id: product.id,
    quantity: claims.quantity,
    buyer_address: null,
    amount_micro: product.price_micro * claims.quantity,
    derivation_index: claims.derivationIndex,
    tx_hash: null,
    status: aged ? "expired" : "pending",
    created_at,
    paid_at: null,
  };
  if (shouldAutoPay(order)) {
    order.status = "paid";
    order.paid_at = new Date().toISOString();
    order.tx_hash = demoTxHash(id);
  }
  return order;
}

function rememberOrder(order: Order) {
  mutate((state) => {
    const index = state.orders.findIndex((item) => item.id === order.id);
    if (index === -1) state.orders.push(order);
    else state.orders[index] = order;
    if (order.status !== "expired") attachDerivedVouchers(state, order);
    if (order.status === "paid") {
      for (const voucher of state.vouchers) {
        if (voucher.order_id === order.id && voucher.status === "reserved") {
          voucher.status = "sold";
          voucher.sold_at = order.paid_at;
        }
      }
    }
  });
}

export async function listProducts(): Promise<Product[]> {
  if (usingNeon()) return neonShop.neonListProducts();
  return loadState().products.filter((product) => product.active === 1);
}

export async function listAllProducts(): Promise<Product[]> {
  if (usingNeon()) return neonShop.neonListAllProducts();
  return loadState().products;
}

export async function getProduct(id: number): Promise<Product | undefined> {
  if (usingNeon()) return neonShop.neonGetProduct(id);
  return loadState().products.find((product) => product.id === id);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (usingNeon()) return neonShop.neonGetProductBySlug(slug);
  return loadState().products.find((product) => product.slug === slug);
}

export async function countAvailable(productId: number): Promise<number> {
  if (usingNeon()) return neonShop.neonCountAvailable(productId);
  return loadState().vouchers.filter(
    (voucher) => voucher.product_id === productId && voucher.status === "available"
  ).length;
}

export async function createOrder(input: {
  id?: string;
  productId: number;
  quantity: number;
  buyerAddress?: string;
}): Promise<Order> {
  const product = await getProduct(input.productId);
  if (!product) {
    throw new Error("Product not found");
  }
  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }
  if (!merchantPrivateKeyConfigured()) {
    throw new Error(MERCHANT_KEY_ERROR);
  }

  const createdAtMs = Date.now();
  const claims = input.id ? parseOrderToken(input.id) : null;
  if (input.id && !claims) throw new Error("Invalid order id");

  if (usingNeon()) {
    const derivationIndex =
      claims?.derivationIndex ??
      allocateHdIndex(await neonShop.neonHeldIndexes());
    const id =
      input.id ??
      issueOrderToken({
        slug: product.slug,
        quantity,
        createdAtMs,
        derivationIndex,
      });
    try {
      return await neonShop.neonCreateOrder({
        id,
        productId: input.productId,
        quantity,
        buyerAddress: input.buyerAddress,
        amountMicro: product.price_micro * quantity,
        createdAt: new Date(createdAtMs).toISOString(),
        derivationIndex,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("orders_live_hd")) {
        const retryIndex = allocateHdIndex(await neonShop.neonHeldIndexes());
        const retryId = issueOrderToken({
          slug: product.slug,
          quantity,
          createdAtMs: Date.now(),
          derivationIndex: retryIndex,
        });
        return neonShop.neonCreateOrder({
          id: retryId,
          productId: input.productId,
          quantity,
          buyerAddress: input.buyerAddress,
          amountMicro: product.price_micro * quantity,
          createdAt: new Date().toISOString(),
          derivationIndex: retryIndex,
        });
      }
      throw error;
    }
  }

  let created: Order | undefined;
  mutate((state) => {
    const available = state.vouchers.filter(
      (voucher) =>
        voucher.product_id === input.productId && voucher.status === "available"
    );
    if (available.length < quantity) {
      throw new Error("Not enough vouchers in stock");
    }
    const claims = input.id ? parseOrderToken(input.id) : null;
    if (input.id && !claims) throw new Error("Invalid order id");
    const derivationIndex =
      claims?.derivationIndex ??
      allocateHdIndex(heldDerivationIndices(state.orders));
    const id =
      input.id ??
      issueOrderToken({
        slug: product.slug,
        quantity,
        createdAtMs,
        derivationIndex,
      });
    const order: Order = {
      id,
      product_id: input.productId,
      quantity,
      buyer_address: input.buyerAddress ?? null,
      amount_micro: product.price_micro * quantity,
      derivation_index: derivationIndex,
      tx_hash: null,
      status: "pending",
      created_at: new Date(createdAtMs).toISOString(),
      paid_at: null,
    };
    state.orders.push(order);
    for (let i = 0; i < quantity; i += 1) {
      const voucher = available[i];
      voucher.order_id = id;
      voucher.status = "reserved";
    }
    created = order;
  });
  return created!;
}

export function orderCreatedMs(order: Order): number {
  const raw = order.created_at.includes("T")
    ? order.created_at
    : `${order.created_at.replace(" ", "T")}Z`;
  return Date.parse(raw);
}

export function isInvoiceAged(order: Order, now = Date.now()): boolean {
  const created = orderCreatedMs(order);
  return Number.isFinite(created) && now - created >= ORDER_TTL_MS;
}

export async function listPendingOrders(): Promise<Order[]> {
  if (usingNeon()) return neonShop.neonListPendingOrders();
  return loadState().orders.filter((order) => order.status === "pending");
}

export async function expireOrder(orderId: string): Promise<boolean> {
  if (usingNeon()) return neonShop.neonExpireOrder(orderId);
  let expired = false;
  mutate((state) => {
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || order.status !== "pending") return;
    order.status = "expired";
    expired = true;
    for (const voucher of state.vouchers) {
      if (voucher.order_id === orderId && voucher.status === "reserved") {
        voucher.status = "available";
        voucher.order_id = null;
      }
    }
  });
  return expired;
}

export async function getOrder(id: string): Promise<Order | undefined> {
  if (usingNeon()) {
    const stored = await neonShop.neonGetOrder(id);
    if (!stored) return undefined;
    if (shouldAutoPay(stored)) {
      if (await neonShop.neonSetOrderTxHash(stored.id, demoTxHash(stored.id))) {
        await neonShop.neonFulfillOrder(stored.id);
      }
      return neonShop.neonGetOrder(id);
    }
    return stored;
  }
  const stored = loadState().orders.find((order) => order.id === id);
  const order = stored ?? synthesizeOrder(id);
  if (!order) return undefined;
  if (!Number.isInteger(order.derivation_index)) {
    order.derivation_index = parseOrderToken(order.id)?.derivationIndex ?? 0;
  }
  if (shouldAutoPay(order)) {
    if (await setOrderTxHash(order.id, demoTxHash(order.id))) await fulfillOrder(order.id);
    return loadState().orders.find((item) => item.id === id) ?? order;
  }
  if (!stored) rememberOrder(order);
  return loadState().orders.find((item) => item.id === id) ?? order;
}

export async function setOrderTxHash(id: string, txHash: string): Promise<boolean> {
  if (usingNeon()) return neonShop.neonSetOrderTxHash(id, txHash);
  let claimed = false;
  mutate((state) => {
    if (state.orders.some((item) => item.tx_hash === txHash)) return;
    let order = state.orders.find((item) => item.id === id);
    if (!order) {
      const synthesized = synthesizeOrder(id);
      if (synthesized) {
        state.orders.push(synthesized);
        attachDerivedVouchers(state, synthesized);
        order = synthesized;
      }
    }
    if (order && order.status !== "expired" && !order.tx_hash) {
      order.tx_hash = txHash;
      claimed = true;
    }
  });
  return claimed;
}

export async function fulfillOrder(orderId: string) {
  if (usingNeon()) {
    await neonShop.neonFulfillOrder(orderId);
    return;
  }
  const now = new Date().toISOString();
  mutate((state) => {
    let order = state.orders.find((item) => item.id === orderId);
    if (!order) {
      const synthesized = synthesizeOrder(orderId);
      if (synthesized) {
        state.orders.push(synthesized);
        attachDerivedVouchers(state, synthesized);
        order = synthesized;
      }
    }
    if (!order || order.status === "expired") return;
    order.status = "paid";
    order.paid_at = now;
    attachDerivedVouchers(state, order);
    for (const voucher of state.vouchers) {
      if (voucher.order_id === orderId && voucher.status === "reserved") {
        voucher.status = "sold";
        voucher.sold_at = now;
      }
    }
  });
}

export async function getVouchersByOrder(orderId: string): Promise<Voucher[]> {
  if (usingNeon()) return neonShop.neonGetVouchersByOrder(orderId);
  const order = await getOrder(orderId);
  if (!order) return [];
  const stored = loadState().vouchers.filter(
    (voucher) => voucher.order_id === orderId
  );
  if (stored.length >= order.quantity) return stored;
  return Array.from({ length: order.quantity }, (_, index) => ({
    id: -1 - index,
    product_id: order.product_id,
    code: voucherCode(`${orderId}:${index}`),
    status: (order.status === "paid" ? "sold" : "reserved") as VoucherStatus,
    order_id: orderId,
    sold_at: order.paid_at,
    used_at: null,
    created_at: order.created_at,
  }));
}

export async function getVoucherById(id: number): Promise<VoucherRow | undefined> {
  if (usingNeon()) return neonShop.neonGetVoucherById(id);
  const state = loadState();
  const voucher = state.vouchers.find((item) => item.id === id);
  return voucher ? toRow(voucher, state) : undefined;
}

export async function getVoucherByCode(code: string): Promise<Voucher | undefined> {
  if (usingNeon()) return neonShop.neonGetVoucherByCode(code);
  return loadState().vouchers.find((voucher) => voucher.code === code);
}

export async function addVouchers(productId: number, codes: string[]) {
  if (usingNeon()) {
    await neonShop.neonAddVouchers(productId, codes);
    return;
  }
  mutate((state) => {
    if (!state.products.some((product) => product.id === productId)) {
      throw new Error("Product not found");
    }
    const now = new Date().toISOString();
    for (const raw of codes) {
      const code = raw.trim();
      if (!code) continue;
      if (state.vouchers.some((voucher) => voucher.code === code)) {
        throw new Error(`Code already exists: ${code}`);
      }
      state.vouchers.push({
        id: state.nextVoucherId,
        product_id: productId,
        code,
        status: "available",
        order_id: null,
        sold_at: null,
        used_at: null,
        created_at: now,
      });
      state.nextVoucherId += 1;
    }
  });
}

export async function listVouchers(filter?: {
  status?: string;
  query?: string;
}): Promise<VoucherRow[]> {
  if (usingNeon()) return neonShop.neonListVouchers(filter);
  const state = loadState();
  return state.vouchers
    .filter((voucher) => {
      if (filter?.status && filter.status !== "all" && voucher.status !== filter.status) {
        return false;
      }
      if (filter?.query) {
        const product = state.products.find((item) => item.id === voucher.product_id);
        const hay = `${voucher.code} ${product?.name ?? ""} ${product?.brand ?? ""} ${voucher.order_id ?? ""}`.toLowerCase();
        if (!hay.includes(filter.query.toLowerCase())) return false;
      }
      return true;
    })
    .sort((left, right) => right.id - left.id)
    .map((voucher) => toRow(voucher, state));
}

export async function voucherStats() {
  if (usingNeon()) return neonShop.neonVoucherStats();
  const vouchers = loadState().vouchers;
  return {
    total: vouchers.length,
    available: vouchers.filter((voucher) => voucher.status === "available").length,
    used: vouchers.filter((voucher) => voucher.status === "used").length,
    expired: vouchers.filter((voucher) => voucher.status === "expired").length,
  };
}

export async function listRecentActivity(limit = 8): Promise<VoucherRow[]> {
  if (usingNeon()) return neonShop.neonListRecentActivity(limit);
  const state = loadState();
  return state.vouchers
    .filter((voucher) =>
      ["sold", "used", "reserved"].includes(voucher.status)
    )
    .sort((left, right) => {
      const leftAt = left.used_at ?? left.sold_at ?? left.created_at;
      const rightAt = right.used_at ?? right.sold_at ?? right.created_at;
      return rightAt.localeCompare(leftAt);
    })
    .slice(0, limit)
    .map((voucher) => toRow(voucher, state));
}

export async function isTxHashUsed(txHash: string): Promise<boolean> {
  if (usingNeon()) return neonShop.neonIsTxHashUsed(txHash);
  return loadState().orders.some((order) => order.tx_hash === txHash);
}

export async function redeemVoucher(
  code: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (usingNeon()) return neonShop.neonRedeemVoucher(code);
  const voucher = await getVoucherByCode(code);
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
  mutate((state) => {
    const row = state.vouchers.find((item) => item.id === voucher.id);
    if (row) {
      row.status = "used";
      row.used_at = new Date().toISOString();
    }
  });
  return { ok: true };
}
