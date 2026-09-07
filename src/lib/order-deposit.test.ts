import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderDepositAddress } from "./order-deposit.ts";
import { matchUnusedTransfer } from "./usdc-transfer.ts";

const ROOT =
  "0x55d0c426bccaff91404aaaa8e901b0c94d47c0e1c98703400d6761cffee0cf06";

process.env.MERCHANT_PRIVATE_KEY = ROOT;

describe("orderDepositAddress", () => {
  it("is stable for the same order id", () => {
    const first = orderDepositAddress("amazon.1.1.aaaaaaaaaaaaaaaa");
    const second = orderDepositAddress("amazon.1.1.aaaaaaaaaaaaaaaa");
    assert.match(first, /^0x[0-9a-fA-F]{40}$/);
    assert.equal(first, second);
  });

  it("gives ten order ids ten deposit addresses", () => {
    const addresses = Array.from({ length: 10 }, (_, index) =>
      orderDepositAddress(`amazon.1.${index}.aaaaaaaaaaaaaaaa`)
    );
    assert.equal(new Set(addresses).size, 10);
  });
});

describe("matchUnusedTransfer", () => {
  it("does not let a later checkout claim another address transfer", () => {
    const logs = [{ tx: "0xalice", value: 25_000_000n }];
    assert.equal(matchUnusedTransfer(logs, 25_000_000n, new Set()), "0xalice");
    assert.equal(matchUnusedTransfer(logs, 25_000_000n, new Set(["0xalice"])), null);
    assert.equal(matchUnusedTransfer(logs, 75_000_000n, new Set()), null);
  });
});
