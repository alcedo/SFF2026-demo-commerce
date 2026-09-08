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

    assert.match(route, /await expireAgedInvoices\(/);
    assert.doesNotMatch(route, /from ["']@\/lib\/payment["']/);
    assert.doesNotMatch(route, /findIncomingUsdcTransfer/);
    assert.doesNotMatch(route, /detectAndFulfill/);

    assert.match(db, /export async function expireAgedInvoices/);
    assert.match(db, /export async function getOrder/);
    assert.doesNotMatch(db, /findIncomingUsdcTransfer|getLogs|detectAndFulfill/);

    const banned = "reconcile" + "AgedInvoices";
    assert.doesNotMatch(route, new RegExp(banned));
    assert.doesNotMatch(payment, new RegExp(banned));
    assert.match(payment, /export type ScanResult/);
    assert.match(payment, /export async function findIncomingUsdcTransfer/);
    assert.match(payment, /export async function detectAndFulfill/);
  });

  it("keeps on-chain detect on POST poll and verify, not GET [id]", () => {
    const poll = readSrc("../app/api/orders/[id]/route.ts");
    const verify = readSrc("../app/api/orders/[id]/verify/route.ts");
    const getStart = poll.indexOf("export async function GET");
    const postStart = poll.indexOf("export async function POST");
    assert.ok(getStart >= 0 && postStart > getStart);
    assert.doesNotMatch(poll.slice(getStart, postStart), /detectAndFulfill/);
    assert.match(poll.slice(postStart), /await detectAndFulfill/);
    assert.match(verify, /verifyUsdcPayment/);
    assert.match(verify, /applyVerifiedPayment/);
    assert.doesNotMatch(verify, /410/);
  });
});
