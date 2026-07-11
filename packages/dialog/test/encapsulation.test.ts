import { describe, expect, it } from "vitest";
import { createDialogController, createDialogStore } from "../src/index.js";

describe("DialogController encapsulation", () => {
  it("does not expose live mutable instance registries", () => {
    const controller = createDialogController();
    controller.register("settings");
    controller.open("settings");

    const snapshot = controller.snapshotInstances();
    snapshot.settings.open = false;

    expect(controller.isOpen("settings")).toBe(true);
  });

  it("reports registration through hasInstance", () => {
    const controller = createDialogController();
    controller.register("settings");

    expect(controller.hasInstance("settings")).toBe(true);
    controller.unregister("settings");
    expect(controller.hasInstance("settings")).toBe(false);
  });

  it("keeps the controller as the source of truth in standalone stores", () => {
    const store = createDialogStore();
    store.register("settings");
    store.open("settings");

    store.instances.settings.open = false;

    expect(store.isOpen("settings")).toBe(true);
  });
});
