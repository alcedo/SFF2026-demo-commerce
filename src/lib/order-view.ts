import { catalogBySlug } from "./catalog";
import { formatUsdc, fromMicroUsdc, USDC_ADDRESS } from "./config";
import { countAvailable, getOrder, getProduct, getVouchersByOrder, type Order, type Product } from "./db";
import { orderDepositAddress } from "./order-deposit";

export type PublicProduct = {
  id: number;
  slug: string;
  brand: string;
  name: string;
  description: string;
  category: string;
  usdValue: number;
  priceUsdc: number;
  theme: string;
  available: number;
  redeemUrl: string;
  redeemSteps: string[];
};

export type PublicOrder = {
  id: string;
  status: Order["status"];
  quantity: number;
  amountUsdc: number;
  amountMicro: number;
  amountLabel: string;
  merchantAddress: string;
  derivationIndex: number;
  usdcAddress: string;
  txHash: string | null;
  createdAt: string;
  paidAt: string | null;
  product: PublicProduct;
  voucherCodes: string[];
};

export async function toPublicProduct(product: Product): Promise<PublicProduct> {
  const catalog = catalogBySlug(product.slug);
  return {
    id: product.id,
    slug: product.slug,
    brand: product.brand,
    name: product.name,
    description: product.description,
    category: product.category,
    usdValue: fromMicroUsdc(product.price_micro),
    priceUsdc: fromMicroUsdc(product.price_micro),
    theme: product.theme,
    available: await countAvailable(product.id),
    redeemUrl: catalog?.redeemUrl ?? "https://example.com/redeem",
    redeemSteps: catalog?.redeemSteps ?? [
      "Open the brand website",
      "Sign in to your account",
      "Enter your voucher code",
      "The balance is added to your account",
    ],
  };
}

export async function loadPublicOrder(id: string): Promise<PublicOrder | null> {
  const order = await getOrder(id);
  if (!order) return null;
  return toPublicOrder(order);
}

export async function toPublicOrder(order: Order): Promise<PublicOrder> {
  const product = await getProduct(order.product_id);
  if (!product) {
    throw new Error("Order product missing");
  }
  return {
    id: order.id,
    status: order.status,
    quantity: order.quantity,
    amountUsdc: fromMicroUsdc(order.amount_micro),
    amountMicro: order.amount_micro,
    amountLabel: `${formatUsdc(order.amount_micro)} USDC`,
    merchantAddress: orderDepositAddress(order.derivation_index),
    derivationIndex: order.derivation_index,
    usdcAddress: USDC_ADDRESS,
    txHash: order.tx_hash,
    createdAt: order.created_at,
    paidAt: order.paid_at,
    product: await toPublicProduct(product),
    voucherCodes:
      order.status === "paid"
        ? (await getVouchersByOrder(order.id)).map((voucher) => voucher.code)
        : [],
  };
}
