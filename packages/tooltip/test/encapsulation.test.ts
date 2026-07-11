import { describe, expect, it } from "vitest";
import { createTooltipController, createTooltipStore } from "../src/index.js";

describe("TooltipController encapsulation", () => {
  it("does not expose live mutable instance registries", () => {
    const controller = createTooltipController();
    controller.register("help");
    controller.open("help");

    const snapshot = controller.snapshotInstances();
    snapshot.help.open = false;

    expect(controller.isOpen("help")).toBe(true);
  });

  it("reports registration through hasInstance", () => {
    const controller = createTooltipController();
    controller.register("help");

    expect(controller.hasInstance("help")).toBe(true);
    controller.unregister("help");
    expect(controller.hasInstance("help")).toBe(false);
  });

  it("keeps the controller as the source of truth in standalone stores", () => {
    const store = createTooltipStore();
    store.register("help");
    store.open("help");

    store.instances.help.open = false;

    expect(store.isOpen("help")).toBe(true);
  });
});
