import { describe, expect, it } from "vitest";
import { createMenuController, createMenuStore } from "../src/index.js";

describe("MenuController encapsulation", () => {
  it("does not expose live mutable instance registries", () => {
    const controller = createMenuController();
    controller.register("demo");
    controller.open("demo");

    const snapshot = controller.snapshotInstances();
    snapshot.demo.open = false;

    expect(controller.isOpen("demo")).toBe(true);
  });

  it("reports registration through hasInstance", () => {
    const controller = createMenuController();
    controller.register("demo");

    expect(controller.hasInstance("demo")).toBe(true);
    controller.unregister("demo");
    expect(controller.hasInstance("demo")).toBe(false);
  });

  it("keeps the controller as the source of truth in standalone stores", () => {
    const store = createMenuStore();
    store.register("demo");
    store.open("demo");

    store.instances.demo.open = false;

    expect(store.isOpen("demo")).toBe(true);
  });
});
