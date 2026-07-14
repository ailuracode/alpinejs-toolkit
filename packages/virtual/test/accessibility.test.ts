import { describe, expect, it } from "vitest";
import { VirtualController } from "../src/controller.js";

describe("@ailuracode/alpine-virtual accessibility", () => {
  it("exposes list semantics without inline styles", () => {
    const controller = new VirtualController();
    controller.create("list", { count: 10, estimateSize: 32 });

    expect(controller.listProps("list", { label: "Rows" })).toEqual({
      role: "list",
      "aria-label": "Rows",
      "aria-orientation": "vertical",
    });

    const itemProps = controller.itemProps("list", 0);
    expect(itemProps.role).toBe("listitem");
    expect(itemProps["aria-setsize"]).toBe(10);
    expect(itemProps["aria-posinset"]).toBe(1);
    expect(itemProps).not.toHaveProperty("style");
    expect(controller.contentProps("list")).toEqual({ "data-virtual-total-size": 320 });
  });
});
