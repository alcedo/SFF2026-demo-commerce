import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

function readSrc(rel: string) {
  return fs.readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}

describe("POST /api/orders buy path", () => {
  it("expires aged invoices locally and does not scan Sepolia before createOrder", () => {
    const route = readSrc("../app/api/orders/route.ts");
    const db = readSrc("./db.ts");
    const payment = readSrc("./payment.ts");

    assert.match(route, /expireAgedInvoices\(/);
    assert.doesNotMatch(route, /reconcileAgedInvoices/);
    assert.doesNotMatch(route, /from ["']@\/lib\/payment["']/);
    assert.doesNotMatch(route, /findIncomingUsdcTransfer/);
    assert.doesNotMatch(route, /detectAndFulfill/);

    assert.match(db, /export function expireAgedInvoices/);
    assert.doesNotMatch(db, /findIncomingUsdcTransfer|getLogs|detectAndFulfill/);

    assert.doesNotMatch(payment, /reconcileAgedInvoices/);
    assert.match(payment, /export async function findIncomingUsdcTransfer/);
    assert.match(payment, /export async function detectAndFulfill/);
  });

  it("keeps on-chain detect on poll and verify routes", () => {
    const poll = readSrc("../app/api/orders/[id]/route.ts");
    const verify = readSrc("../app/api/orders/[id]/verify/route.ts");
    assert.match(poll, /detectAndFulfill/);
    assert.match(verify, /verifyUsdcPayment/);
  });
});
