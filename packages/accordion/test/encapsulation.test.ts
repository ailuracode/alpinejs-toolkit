import { describe, expect, it } from "vitest";
import { createAccordionController } from "../src/index.js";

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
});
