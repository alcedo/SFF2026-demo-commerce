import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchUnusedTransfer,
  newPayTag,
  payableAmountMicro,
} from "./payable-amount.ts";

const AMAZON = 25_000_000;

describe("payableAmountMicro", () => {
  it("gives ten tags ten distinct invoices", () => {
    const amounts = Array.from({ length: 10 }, (_, index) =>
      payableAmountMicro(AMAZON, index + 1)
    );
    assert.equal(new Set(amounts).size, 10);
    assert.ok(newPayTag() <= 9_999);
  });

  it("does not let a later checkout claim an earlier invoice transfer", () => {
    const alice = payableAmountMicro(AMAZON, 137);
    const bob = payableAmountMicro(AMAZON, 891);
    const logs = [{ tx: "0xalice", value: BigInt(alice) }];
    assert.equal(matchUnusedTransfer(logs, BigInt(bob), new Set()), null);
    assert.equal(matchUnusedTransfer(logs, BigInt(alice), new Set()), "0xalice");
  });
});
