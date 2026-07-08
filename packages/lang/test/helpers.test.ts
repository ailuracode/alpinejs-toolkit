import { describe, expect, it } from "vitest";
import { normalizeLanguageTag, parseLanguageTag } from "../src/index.js";

describe("normalizeLanguageTag", () => {
  it("lowercases and replaces underscores with dashes", () => {
    expect(normalizeLanguageTag("ES-EC")).toBe("es-ec");
    expect(normalizeLanguageTag("en_US")).toBe("en-us");
    expect(normalizeLanguageTag("  Pt-BR ")).toBe("pt-br");
  });

  it("is idempotent", () => {
    expect(normalizeLanguageTag(normalizeLanguageTag("EN-us"))).toBe("en-us");
  });
});

describe("parseLanguageTag", () => {
  it("splits a region-tagged value without mutating case", () => {
    expect(parseLanguageTag("es-EC")).toEqual({ base: "es", region: "EC" });
    expect(parseLanguageTag("EN_us")).toEqual({ base: "EN", region: "us" });
  });

  it("returns null region when only a base is present", () => {
    expect(parseLanguageTag("EN")).toEqual({ base: "EN", region: null });
  });

  it("returns empty parts for an empty input", () => {
    expect(parseLanguageTag("")).toEqual({ base: "", region: null });
  });
});
