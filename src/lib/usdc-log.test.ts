import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { USDC_ADDRESS } from "./config.ts";
import {
  decodeUsdcTransfer,
  mergeRpcLogs,
  paddedAddress,
  topicAddress,
  USDC_TOKEN,
} from "./usdc-log.ts";

const receiptLog = {
  address: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238",
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x000000000000000000000000e432a39ea2303dd8dd71c4afec65afa904afb6cb",
    "0x0000000000000000000000002910180b4fb116f1b8301cdb476116af7bb47a2e",
  ],
  data: "0x00000000000000000000000000000000000000000000000000000000000061a8",
  transactionHash:
    "0xa5a5b527b184079683b5262482ee17403fb69dfeaaf84222b071022dd0af4c19",
};

describe("decodeUsdcTransfer", () => {
  it("uses the shop USDC token address", () => {
    assert.equal(USDC_TOKEN.toLowerCase(), USDC_ADDRESS.toLowerCase());
  });

  it("reads the Amazon invoice Transfer off the receipt log", () => {
    const decoded = decodeUsdcTransfer(receiptLog);
    assert.ok(decoded);
    assert.equal(decoded.from, "0xe432a39ea2303dd8dd71c4afec65afa904afb6cb");
    assert.equal(decoded.to, "0x2910180b4fb116f1b8301cdb476116af7bb47a2e");
    assert.equal(decoded.value, 25_000n);
    assert.equal(decoded.tx, receiptLog.transactionHash);
  });

  it("ignores a log from another token", () => {
    assert.equal(
      decodeUsdcTransfer({ ...receiptLog, address: "0x" + "11".repeat(20) }),
      null
    );
  });
});

describe("mergeRpcLogs", () => {
  it("keeps hits from a later RPC when an earlier one returns no logs", () => {
    const merged = mergeRpcLogs([[], [receiptLog]]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].transactionHash, receiptLog.transactionHash);
  });
});

describe("paddedAddress", () => {
  it("topic-encodes a deposit so getLogs can filter Transfer.to", () => {
    assert.equal(
      paddedAddress("0x2910180B4fb116f1b8301cdb476116AF7BB47a2e"),
      "0x0000000000000000000000002910180b4fb116f1b8301cdb476116af7bb47a2e"
    );
    assert.equal(
      topicAddress(
        "0x0000000000000000000000002910180b4fb116f1b8301cdb476116af7bb47a2e"
      ),
      "0x2910180b4fb116f1b8301cdb476116af7bb47a2e"
    );
  });
});
