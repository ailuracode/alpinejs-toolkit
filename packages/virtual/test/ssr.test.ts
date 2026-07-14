import { describe, expect, it } from "vitest";

describe("@ailuracode/alpine-virtual ssr", () => {
  it("imports without DOM access", async () => {
    const mod = await import("../src/index.js");
    const controller = mod.createVirtualController();
    controller.create("ssr", { count: 100, estimateSize: 40 });
    controller.bindScrollElement("ssr", null);

    const instance = controller.snapshotInstances().ssr;
    expect(instance?.count).toBe(100);
    expect(instance?.viewportSize).toBe(0);
  });
});
