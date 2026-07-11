import { describe, expect, it } from "vitest";
import {
  deleteValueAtPath,
  getValueAtPath,
  normalizePath,
  setValueAtPath,
  splitPath,
  valuesEqual,
} from "../src/paths.js";

describe("@ailuracode/alpine-form paths", () => {
  it("normalizes bracket notation", () => {
    expect(normalizePath("items[0].name")).toBe("items.0.name");
  });

  it("reads and writes nested values", () => {
    const target: Record<string, unknown> = {};
    setValueAtPath(target, "address.city", "Quito");
    expect(getValueAtPath(target, "address.city")).toBe("Quito");
  });

  it("splits nested paths", () => {
    expect(splitPath("address.city")).toEqual(["address", "city"]);
  });

  it("deletes nested values", () => {
    const target: Record<string, unknown> = { email: "a@b.com", address: { city: "Quito" } };
    deleteValueAtPath(target, "address.city");
    expect(getValueAtPath(target, "address.city")).toBeUndefined();
  });

  it("compares values deeply", () => {
    expect(valuesEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(valuesEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});
