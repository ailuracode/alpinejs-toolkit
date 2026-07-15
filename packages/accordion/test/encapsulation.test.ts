import { describe, expect, it } from "vitest";
import { createAccordionController, createAccordionStore } from "../src/index.js";

describe("AccordionController encapsulation", () => {
  it("does not expose live mutable group registries", () => {
    const controller = createAccordionController();
    controller.register("faq", { mode: "single" });
    controller.registerItem("faq", "item-1");
    controller.open("faq", "item-1");

    const snapshot = controller.snapshotGroups();
    snapshot.faq.open["item-1"] = false;

    expect(controller.isOpen("faq", "item-1")).toBe(true);
  });

  it("reports registration through hasGroup", () => {
    const controller = createAccordionController();
    controller.register("faq");

    expect(controller.hasGroup("faq")).toBe(true);
    controller.unregister("faq");
    expect(controller.hasGroup("faq")).toBe(false);
  });

  it("keeps the controller as the source of truth in standalone stores", () => {
    const store = createAccordionStore();
    store.register("faq", { mode: "single" });
    store.registerItem("faq", "item-1");
    store.open("faq", "item-1");

    store.groups.faq.open["item-1"] = false;

    expect(store.isOpen("faq", "item-1")).toBe(true);
  });
});
