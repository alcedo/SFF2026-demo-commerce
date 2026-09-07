import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  allocateHdIndex,
  heldDerivationIndices,
  MERCHANT_KEY_ERROR,
  merchantPrivateKeyConfigured,
  merchantPrivateKeyHex,
  merchantPrivateKeySource,
  orderDepositAddress,
} from "./order-deposit.ts";
import { matchUnusedTransfer } from "./usdc-transfer.ts";

const ROOT =
  "0x55d0c426bccaff91404aaaa8e901b0c94d47c0e1c98703400d6761cffee0cf06";

const savedKey = process.env.MERCHANT_PRIVATE_KEY;

beforeEach(() => {
  process.env.MERCHANT_PRIVATE_KEY = ROOT;
});

afterEach(() => {
  if (savedKey === undefined) delete process.env.MERCHANT_PRIVATE_KEY;
  else process.env.MERCHANT_PRIVATE_KEY = savedKey;
});

describe("merchantPrivateKeyHex", () => {
  it("uses the demo seed when the env var is missing", () => {
    const expected = orderDepositAddress(0);
    delete process.env.MERCHANT_PRIVATE_KEY;
    assert.equal(merchantPrivateKeyHex(), ROOT.slice(2));
    assert.equal(merchantPrivateKeySource(), "demo");
    assert.equal(merchantPrivateKeyConfigured(), true);
    assert.equal(orderDepositAddress(0), expected);
  });

  it("strips wrapping quotes and whitespace", () => {
    process.env.MERCHANT_PRIVATE_KEY = `  "${ROOT}"  `;
    assert.equal(merchantPrivateKeyHex(), ROOT.slice(2));
    assert.equal(merchantPrivateKeySource(), "env");
  });

  it("strips a KEY= paste prefix", () => {
    process.env.MERCHANT_PRIVATE_KEY = `MERCHANT_PRIVATE_KEY=${ROOT}`;
    assert.equal(merchantPrivateKeyHex(), ROOT.slice(2));
    assert.equal(merchantPrivateKeySource(), "env");
  });

  it("rejects a too-short key instead of falling back", () => {
    process.env.MERCHANT_PRIVATE_KEY = "ab";
    assert.equal(merchantPrivateKeyHex(), undefined);
    assert.equal(merchantPrivateKeyConfigured(), false);
    assert.equal(merchantPrivateKeySource(), "invalid");
    assert.throws(() => orderDepositAddress(0), { message: MERCHANT_KEY_ERROR });
  });
});

describe("orderDepositAddress", () => {
  it("is stable for the same HD index", () => {
    const first = orderDepositAddress(0);
    const second = orderDepositAddress(0);
    assert.match(first, /^0x[0-9a-fA-F]{40}$/);
    assert.equal(first, second);
  });

  it("gives ten indexes ten deposit addresses", () => {
    const addresses = Array.from({ length: 10 }, (_, index) =>
      orderDepositAddress(index)
    );
    assert.equal(new Set(addresses).size, 10);
  });
});

describe("allocateHdIndex", () => {
  it("reuses the smallest index that is not pending or paid", () => {
    assert.equal(allocateHdIndex([]), 0);
    assert.equal(allocateHdIndex([0, 1, 2]), 3);
    assert.equal(
      allocateHdIndex(
        heldDerivationIndices([
          { status: "paid", derivation_index: 0 },
          { status: "expired", derivation_index: 1 },
          { status: "pending", derivation_index: 2 },
        ])
      ),
      1
    );
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
