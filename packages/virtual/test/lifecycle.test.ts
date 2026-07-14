import { describe, expect, it } from "vitest";
import { VirtualController } from "../src/controller.js";

describe("@ailuracode/alpine-virtual lifecycle", () => {
  it("destroy is idempotent", () => {
    const controller = new VirtualController();
    controller.create("list", { count: 3 });
    controller.destroy();
    controller.destroy();
    expect(controller.isDestroyed).toBe(true);
  });

  it("destroyAll clears instances", () => {
    const controller = new VirtualController();
    controller.create("a", { count: 1 });
    controller.create("b", { count: 1 });
    controller.destroyAll();
    expect(controller.snapshotInstances()).toEqual({});
  });
});
