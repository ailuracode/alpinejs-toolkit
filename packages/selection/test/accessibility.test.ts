import { describe, expect, it } from "vitest";
import { SelectionController } from "../src/controller.js";

describe("@ailuracode/alpine-selection accessibility", () => {
  it("exposes listbox and option props", () => {
    const controller = new SelectionController();
    controller.create("list", { mode: "multiple", keys: ["a", "b"] });
    controller.replace("list", "a");
    controller.setActive("list", "a");

    expect(controller.listProps("list", { label: "Items" })).toMatchObject({
      role: "listbox",
      "aria-label": "Items",
      "aria-multiselectable": true,
    });
    expect(controller.itemProps("list", "a")).toMatchObject({
      role: "option",
      "aria-selected": true,
      "data-selection-active": true,
    });
    expect(controller.itemProps("list", "b")).toMatchObject({
      "aria-selected": false,
    });
  });

  it("marks disabled options", () => {
    const controller = new SelectionController();
    controller.create("list", { keys: ["a", "b"], disabledKeys: ["b"] });
    expect(controller.itemProps("list", "b")["aria-disabled"]).toBe(true);
  });
});
