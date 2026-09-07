const APP = process.env.APP_URL ?? "http://localhost:3000";

const orders = [];
for (let i = 0; i < 10; i += 1) {
  const res = await fetch(`${APP}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "amazon", quantity: 1 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(body));
  orders.push(body.order);
}

const amounts = new Set(orders.map((order) => order.amountMicro));
const addresses = new Set(orders.map((order) => order.merchantAddress));
console.log(
  orders
    .map((order) => `${order.id} ${order.amountLabel} ${order.merchantAddress}`)
    .join("\n")
);
console.log("unique amounts:", amounts.size);
console.log("unique deposit addresses:", addresses.size);

if (amounts.size !== 1 || !amounts.has(25_000_000)) {
  console.log("FAIL ten Amazon checkouts must all invoice 25.00 USDC");
  process.exit(1);
}

if (addresses.size !== 10) {
  console.log("FAIL ten Amazon checkouts still share a deposit address");
  process.exit(1);
}

for (const order of orders) {
  const poll = await fetch(`${APP}/api/orders/${order.id}`);
  const again = await poll.json();
  if (again.order.merchantAddress !== order.merchantAddress) {
    console.log("FAIL GET changed the deposit address");
    process.exit(1);
  }
  if (again.order.amountMicro !== 25_000_000) {
    console.log("FAIL GET changed the catalog amount");
    process.exit(1);
  }
}

console.log("PASS ten simultaneous Amazon orders share 25.00 USDC and keep distinct deposit addresses");
