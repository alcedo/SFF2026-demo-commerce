const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const productsRes = await fetch(`${APP_URL}/api/products`);
  if (!productsRes.ok) {
    throw new Error(`products ${productsRes.status}`);
  }
  const { products } = await productsRes.json();
  const product = products.find((item) => item.slug === "amazon") ?? products[0];
  if (!product) throw new Error("No products");

  const orderRes = await fetch(`${APP_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "amazon", quantity: 3 }),
  });
  const orderData = await orderRes.json();
  if (!orderRes.ok) throw new Error(orderData.error ?? "Order create failed");
  const orderId = orderData.order.id;
  if (orderData.order.voucherCodes?.length) {
    throw new Error("Pending order leaked codes");
  }
  const catalogUsdc = 75;
  const payable = orderData.order.amountUsdc;
  if (payable !== catalogUsdc) {
    throw new Error(`Expected ${catalogUsdc} USDC, got ${payable}`);
  }
  if (!orderData.order.merchantAddress) {
    throw new Error("Order missing deposit address");
  }

  let paid = null;
  for (let i = 0; i < 20; i += 1) {
    await wait(1000);
    const poll = await fetch(`${APP_URL}/api/orders/${orderId}`);
    const body = await poll.json();
    if (body.order?.status === "paid") {
      paid = body.order;
      break;
    }
  }
  if (!paid) throw new Error("Order did not auto-fulfill");
  if (paid.voucherCodes.length !== 3) {
    throw new Error(`Expected 3 codes, got ${paid.voucherCodes.length}`);
  }
  console.log("verify-purchase ok", orderId, paid.voucherCodes.join(","));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
