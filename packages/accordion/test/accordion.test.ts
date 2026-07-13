import { beforeEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import accordionPlugin, { createAccordionStore } from "../src/index.js";

describe("@ailuracode/alpine-accordion", () => {
  let store: ReturnType<typeof createAccordionStore>;

  beforeEach(() => {
    store = createAccordionStore();
    store.register("faq", { mode: "single" });
    store.registerItem("faq", "item-1");
    store.registerItem("faq", "item-2");
    store.registerItem("faq", "item-3");
  });

  it("opens and closes items", () => {
    store.open("faq", "item-1");
    expect(store.isOpen("faq", "item-1")).toBe(true);

    store.toggle("faq", "item-1");
    expect(store.isOpen("faq", "item-1")).toBe(false);
  });

  it("allows only one open item in single mode", () => {
    store.open("faq", "item-1");
    store.open("faq", "item-2");

    expect(store.isOpen("faq", "item-1")).toBe(false);
    expect(store.isOpen("faq", "item-2")).toBe(true);
  });

  it("keeps the controller as the source of truth in standalone stores", () => {
    store.open("faq", "item-1");

    store.groups.faq.open["item-1"] = false;

    expect(store.isOpen("faq", "item-1")).toBe(true);
  });

  it("allows multiple open items in multiple mode", () => {
    store.register("multi", { mode: "multiple" });
    store.registerItem("multi", "a");
    store.registerItem("multi", "b");

    store.open("multi", "a");
    store.open("multi", "b");

    expect(store.isOpen("multi", "a")).toBe(true);
    expect(store.isOpen("multi", "b")).toBe(true);
  });

  it("opens default items in single mode", () => {
    store.register("defaults", { mode: "single", defaultOpen: "item-2" });
    store.registerItem("defaults", "item-1");
    expect(store.isOpen("defaults", "item-1")).toBe(false);

    store.registerItem("defaults", "item-2");
    expect(store.isOpen("defaults", "item-2")).toBe(true);
    expect(store.openIds("defaults")).toEqual(["item-2"]);
  });

  it("opens multiple default items in multiple mode", () => {
    store.register("defaults", {
      mode: "multiple",
      defaultOpen: ["a", "c"],
    });
    store.registerItem("defaults", "a");
    store.registerItem("defaults", "b");
    store.registerItem("defaults", "c");

    expect(store.openIds("defaults")).toEqual(["a", "c"]);
  });

  it("uses only the first default in single mode when an array is passed", () => {
    store.register("defaults", {
      mode: "single",
      defaultOpen: ["item-1", "item-2"],
    });
    store.registerItem("defaults", "item-1");
    store.registerItem("defaults", "item-2");

    expect(store.isOpen("defaults", "item-1")).toBe(true);
    expect(store.isOpen("defaults", "item-2")).toBe(false);
  });

  it("exposes ARIA trigger and panel props", () => {
    store.open("faq", "item-1");

    expect(store.triggerProps("faq", "item-1")).toMatchObject({
      "aria-expanded": true,
      "aria-controls": "faq-panel-item-1",
    });

    expect(store.panelProps("faq", "item-1")).toMatchObject({
      id: "faq-panel-item-1",
      role: "region",
      "aria-labelledby": "faq-trigger-item-1",
    });

    expect(store.panelProps("faq", "item-1")["aria-hidden"]).toBeUndefined();
    expect(store.panelProps("faq", "item-2")["aria-hidden"]).toBe(true);
  });

  it("moves active item with keyboard", () => {
    store.setActiveItem("faq", "item-1");

    store.handleKeydown("faq", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(store.activeItem("faq")).toBe("item-2");
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(accordionPlugin());
    const accordion = Alpine.store("accordion") as ReturnType<typeof createAccordionStore>;

    accordion.register("demo");
    accordion.registerItem("demo", "one");
    accordion.open("demo", "one");
    expect(accordion.isOpen("demo", "one")).toBe(true);
  });

  it("handles open on unknown group", () => {
    store.open("nonexistent", "item");
  });

  it("handles open on unknown item", () => {
    store.open("faq", "nonexistent");
  });

  it("handles close on unknown group", () => {
    store.close("nonexistent", "item");
  });

  it("handles close on unknown item", () => {
    store.close("faq", "nonexistent");
  });

  it("handles toggle on unknown group", () => {
    store.toggle("nonexistent", "item");
  });

  it("handles isOpen on unknown group", () => {
    expect(store.isOpen("nonexistent", "item")).toBe(false);
  });

  it("handles openIds on unknown group", () => {
    expect(store.openIds("nonexistent")).toEqual([]);
  });

  it("handles activeItem on unknown group", () => {
    expect(store.activeItem("nonexistent")).toBeNull();
  });

  it("handles setActiveItem on unknown group", () => {
    store.setActiveItem("nonexistent", "item");
  });

  it("handles setActiveItem to null", () => {
    store.setActiveItem("faq", null);
    expect(store.activeItem("faq")).toBeNull();
  });

  it("handles ArrowUp keyboard navigation", () => {
    store.setActiveItem("faq", "item-2");
    store.handleKeydown("faq", new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(store.activeItem("faq")).toBe("item-1");
  });

  it("handles Home and End keys", () => {
    store.handleKeydown("faq", new KeyboardEvent("keydown", { key: "End" }));
    expect(store.activeItem("faq")).toBe("item-3");

    store.handleKeydown("faq", new KeyboardEvent("keydown", { key: "Home" }));
    expect(store.activeItem("faq")).toBe("item-1");
  });

  it("handles wrap-around in navigation", () => {
    store.setActiveItem("faq", "item-3");
    store.handleKeydown("faq", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(store.activeItem("faq")).toBe("item-1");
  });

  it("handles Enter key (no-op for navigation-only)", () => {
    store.setActiveItem("faq", "item-1");
    store.handleKeydown("faq", new KeyboardEvent("keydown", { key: "Enter" }));
    // Enter doesn't toggle items in accordion
  });

  it("unregisterItem removes item", () => {
    store.unregisterItem("faq", "item-1");
    expect(store.isOpen("faq", "item-1")).toBe(false);
  });

  it("unregisterItem handles unknown group", () => {
    store.unregisterItem("nonexistent", "item");
  });

  it("unregister removes group", () => {
    store.unregister("faq");
    expect(store.isOpen("faq", "item-1")).toBe(false);
  });

  it("triggerProps for closed item", () => {
    const props = store.triggerProps("faq", "item-1");
    expect(props["aria-expanded"]).toBe(false);
  });

  it("panelProps for open item has no aria-hidden", () => {
    store.open("faq", "item-1");
    const props = store.panelProps("faq", "item-1");
    expect(props["aria-hidden"]).toBeUndefined();
  });

  it("handles multiple open in single mode via toggle", () => {
    store.toggle("faq", "item-1");
    store.toggle("faq", "item-2");
    expect(store.isOpen("faq", "item-1")).toBe(false);
    expect(store.isOpen("faq", "item-2")).toBe(true);
  });
});
