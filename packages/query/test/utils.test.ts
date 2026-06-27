import { describe, expect, it } from "vitest";
import { serializeDevtoolsError, serializeDevtoolsValue } from "../src/devtools.js";
import {
  getRetryDelay,
  hashKey,
  matchesQueryKey,
  normalizeInvalidationKeys,
  resolveRetryCount,
  resolveRetryDelay,
} from "../src/utils.js";

describe("@ailuracode/alpinejs-query utils", () => {
  it("hashKey() serializes bigint and Date values", () => {
    expect(hashKey(["time", new Date("2024-01-01T00:00:00.000Z")])).toContain("2024-01-01");
    expect(hashKey(["count", 1n])).toBe('["count","1"]');
  });

  it("resolveRetryCount() handles boolean and fallback values", () => {
    expect(resolveRetryCount(false, 3)).toBe(0);
    expect(resolveRetryCount(true, 0)).toBe(3);
    expect(resolveRetryCount(2, 0)).toBe(2);
    expect(resolveRetryCount(undefined, 5)).toBe(5);
  });

  it("resolveRetryDelay() and getRetryDelay() support functions", () => {
    const delay = (attempt: number) => attempt * 10;
    expect(resolveRetryDelay(delay, 5)).toBe(delay);
    expect(getRetryDelay(25, 2)).toBe(25);
    expect(getRetryDelay(delay, 2)).toBe(20);
  });

  it("normalizeInvalidationKeys() wraps single query keys", () => {
    expect(normalizeInvalidationKeys(undefined)).toBeNull();
    expect(normalizeInvalidationKeys(["todos"])).toEqual([["todos"]]);
    expect(normalizeInvalidationKeys([["todos"], ["users"]])).toEqual([["todos"], ["users"]]);
  });

  it("matchesQueryKey() matches partial keys", () => {
    expect(matchesQueryKey(["todos", 1], ["todos"])).toBe(true);
    expect(matchesQueryKey(["todos"], ["todos", 1])).toBe(false);
    expect(matchesQueryKey(["todos", 1], ["todos", 2])).toBe(false);
  });
});

describe("@ailuracode/alpinejs-query devtools serialization", () => {
  it("serializeDevtoolsValue() clones serializable data", () => {
    expect(serializeDevtoolsValue(undefined)).toBeUndefined();
    expect(serializeDevtoolsValue({ ok: true })).toEqual({ ok: true });
  });

  it("serializeDevtoolsValue() falls back for non-cloneable values", () => {
    expect(serializeDevtoolsValue(Symbol("test"))).toBe("Symbol(test)");
  });

  it("serializeDevtoolsError() maps errors", () => {
    expect(serializeDevtoolsError(null)).toBeNull();
    expect(serializeDevtoolsError(new Error("boom"))).toEqual({
      message: "boom",
      name: "Error",
    });
  });
});
