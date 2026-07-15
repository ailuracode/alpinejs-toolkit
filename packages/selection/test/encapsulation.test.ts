import { describe, expect, it } from "vitest";

describe("@ailuracode/alpine-selection contract", () => {
  it("exports the published entrypoint without DOM access", async () => {
    const mod = await import("../src/index.js");
    expect(mod.SelectionController).toBeTypeOf("function");
    expect(mod.selectionPlugin).toBeTypeOf("function");
    expect(mod.serializeSelection).toBeTypeOf("function");
    expect(mod.createControlledAdapter).toBeTypeOf("function");
  });
});
