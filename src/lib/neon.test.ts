import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DATABASE_URL_KEYS,
  hostFromDatabaseUrl,
  resolveDatabaseUrl,
} from "./neon.ts";

const saved = Object.fromEntries(
  DATABASE_URL_KEYS.map((key) => [key, process.env[key]])
);

afterEach(() => {
  for (const key of DATABASE_URL_KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function clearUrls() {
  for (const key of DATABASE_URL_KEYS) delete process.env[key];
}

describe("resolveDatabaseUrl", () => {
  it("ignores blank values and prefers DATABASE_URL", () => {
    clearUrls();
    process.env.POSTGRES_URL = "postgres://from-postgres";
    process.env.DATABASE_URL = "  postgres://from-database  ";
    const found = resolveDatabaseUrl();
    assert.equal(found?.key, "DATABASE_URL");
    assert.equal(found?.url, "postgres://from-database");
  });

  it("falls through aliases when DATABASE_URL is empty", () => {
    clearUrls();
    process.env.DATABASE_URL = "   ";
    process.env.POSTGRES_URL = "postgres://alias";
    const found = resolveDatabaseUrl();
    assert.equal(found?.key, "POSTGRES_URL");
    assert.equal(found?.url, "postgres://alias");
  });

  it("returns undefined when no url is set", () => {
    clearUrls();
    assert.equal(resolveDatabaseUrl(), undefined);
  });
});

describe("hostFromDatabaseUrl", () => {
  it("returns the host without userinfo or path", () => {
    assert.equal(
      hostFromDatabaseUrl(
        "postgresql://user:secret@ep-cool.us-east-2.aws.neon.tech/neondb?sslmode=require"
      ),
      "ep-cool.us-east-2.aws.neon.tech"
    );
  });
});
