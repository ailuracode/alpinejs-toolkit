import { describe, expect, it } from "vitest";

describe("@ailuracode/alpine-selection ssr", () => {
  it("imports without DOM access", async () => {
    const mod = await import("../src/index.js");
    const controller = mod.createSelectionController();
    controller.create("ssr", {
      mode: "multiple",
      keys: ["a", "b", "c"],
      defaultValue: ["a"],
    });

    expect(controller.getSnapshot("ssr").selectedKeys).toEqual(["a"]);
  });
});
