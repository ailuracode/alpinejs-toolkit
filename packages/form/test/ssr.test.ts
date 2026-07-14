import { describe, expect, it } from "vitest";
import formPlugin from "../src/plugin.js";

describe("@ailuracode/alpine-form ssr", () => {
  it("imports without a DOM", async () => {
    const module = await import("../src/index.js");
    expect(module.FormController).toBeTypeOf("function");
    expect(module.formPlugin).toBeTypeOf("function");
  });

  it("exposes a plugin factory without touching browser APIs", () => {
    expect(formPlugin()).toBeTypeOf("function");
  });
});
