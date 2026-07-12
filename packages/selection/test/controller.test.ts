import { describe, expect, it, vi } from "vitest";
import { SelectionController } from "../src/controller.js";
import { SelectionError } from "../src/error.js";

describe("@ailuracode/alpine-selection", () => {
  describe("SelectionController", () => {
    it("supports single selection", () => {
      const controller = new SelectionController();
      controller.create("list", { mode: "single", keys: ["a", "b", "c"] });
      controller.replace("list", "b");

      expect(controller.isSelected("list", "b")).toBe(true);
      expect(controller.getSnapshot("list").value).toBe("b");
    });

    it("supports multiple toggle and extend", () => {
      const controller = new SelectionController();
      controller.create("list", { mode: "multiple", keys: ["a", "b", "c", "d"] });
      controller.toggle("list", "a");
      controller.setAnchor("list", "a");
      controller.extend("list", "c");

      expect(controller.getSnapshot("list").selectedKeys).toEqual(["a", "b", "c"]);
    });

    it("supports range selection with anchor tracking", () => {
      const controller = new SelectionController();
      controller.create("list", { mode: "range", keys: ["a", "b", "c", "d"] });
      controller.replace("list", "b");
      controller.extend("list", "d");

      expect(controller.getSnapshot("list").value).toEqual({ from: "b", to: "d" });
      expect(controller.isAnchor("list", "b")).toBe(true);
      expect(controller.isActive("list", "d")).toBe(true);
    });

    it("skips disabled keys for range and select-all", () => {
      const controller = new SelectionController();
      controller.create("list", {
        mode: "multiple",
        keys: ["a", "b", "c"],
        disabledKeys: ["b"],
      });
      controller.selectAll("list");
      expect(controller.getSnapshot("list").selectedKeys).toEqual(["a", "c"]);
    });

    it("allows disabled selection when configured", () => {
      const controller = new SelectionController();
      controller.create("list", {
        mode: "multiple",
        keys: ["a", "b"],
        disabledKeys: ["b"],
        allowDisabledSelection: true,
      });
      controller.selectAll("list");
      expect(controller.getSnapshot("list").selectedKeys).toEqual(["a", "b"]);
    });

    it("prunes selection when keys are reordered or removed", () => {
      const controller = new SelectionController();
      controller.create("list", {
        mode: "range",
        keys: ["a", "b", "c", "d"],
        defaultValue: { from: "a", to: "d" },
      });
      controller.setKeys("list", ["c", "a"]);

      expect(controller.getSnapshot("list").selectedKeys).toEqual(["c", "a"]);
      controller.setKeys("list", ["x"]);
      expect(controller.getSnapshot("list").value).toBeNull();
    });

    it("converts selection when mode changes", () => {
      const controller = new SelectionController();
      controller.create("list", {
        mode: "multiple",
        keys: ["a", "b", "c"],
        defaultValue: ["a", "c"],
      });
      controller.setMode("list", "range");
      expect(controller.getSnapshot("list").value).toEqual({ from: "a", to: "c" });
      controller.setMode("list", "single");
      expect(controller.getSnapshot("list").value).toBe("a");
    });

    it("emits change events after confirmed transitions", () => {
      const controller = new SelectionController();
      const listener = vi.fn();
      controller.on("change", listener);
      controller.create("list", { mode: "single", keys: ["a", "b"] });
      controller.replace("list", "a");

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]?.[0]?.value).toBe("a");
    });

    it("controlled mode delegates through onChange", () => {
      const onChange = vi.fn();
      const controller = new SelectionController();
      controller.create("list", {
        mode: "single",
        keys: ["a", "b"],
        value: null,
        onChange,
      });
      controller.replace("list", "a");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("clears and destroys instances", () => {
      const controller = new SelectionController();
      controller.create("list", { mode: "multiple", keys: ["a"] });
      controller.clear("list");
      expect(controller.getSnapshot("list").value).toEqual([]);
      controller.destroy("list");
      expect(controller.hasInstance("list")).toBe(false);
    });

    it("throws for unknown instances and keys", () => {
      const controller = new SelectionController();
      expect(() => controller.replace("missing", "a")).toThrow(SelectionError);
      controller.create("list", { keys: ["a"] });
      expect(() => controller.replace("list", "z")).toThrow(SelectionError);
    });

    it("supports multiple independent controller instances", () => {
      const first = new SelectionController("one");
      const second = new SelectionController("two");
      first.create("list", { mode: "single", keys: ["a"], defaultValue: "a" });
      second.create("list", { mode: "single", keys: ["b"], defaultValue: "b" });

      expect(first.getSnapshot("list").value).toBe("a");
      expect(second.getSnapshot("list").value).toBe("b");
    });
  });
});
