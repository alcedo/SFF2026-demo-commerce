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

const amounts = orders.map((order) => order.amountMicro);
const unique = new Set(amounts);
console.log(
  orders.map((order) => `${order.id} ${order.amountLabel}`).join("\n")
);
console.log("unique amounts:", unique.size);

if (unique.size !== 10) {
  console.log("FAIL ten Amazon checkouts still share a payable amount");
  process.exit(1);
}

for (const order of orders) {
  const parts = order.id.split(".");
  const tag = Number(parts[3]);
  const expected = 25_000_000 + tag;
  if (order.amountMicro !== expected) {
    console.log("FAIL token tag does not reconstruct amount", order.id, order.amountMicro);
    process.exit(1);
  }
  const poll = await fetch(`${APP}/api/orders/${order.id}`);
  const again = await poll.json();
  if (again.order.amountMicro !== order.amountMicro) {
    console.log("FAIL GET changed the invoice amount");
    process.exit(1);
  }
}

console.log("PASS ten simultaneous Amazon invoices are distinct and stable");
