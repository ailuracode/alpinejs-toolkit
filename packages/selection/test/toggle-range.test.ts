import { describe, expect, it } from "vitest";
import { SelectionController } from "../src/controller.js";

describe("@ailuracode/alpine-selection toggle range edge cases", () => {
  it("toggle deselects range when toggling the from key of an exact single-key range", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", { mode: "range", keys: ["a", "b", "c"] });
    ctrl.replace("list", "a");
    expect(ctrl.getSnapshot("list").value).toEqual({ from: "a" });
    ctrl.toggle("list", "a");
    expect(ctrl.getSnapshot("list").value).toBeNull();
  });

  it("toggle replaces range when toggling a non-matching key", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", { mode: "range", keys: ["a", "b", "c"] });
    ctrl.replace("list", "a");
    ctrl.toggle("list", "b");
    expect(ctrl.getSnapshot("list").value).toEqual({ from: "b" });
  });

  it("toggle on extended range replaces instead of deselecting", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", { mode: "range", keys: ["a", "b", "c", "d"] });
    ctrl.replace("list", "a");
    ctrl.extend("list", "c");
    expect(ctrl.getSnapshot("list").value).toEqual({ from: "a", to: "c" });
    ctrl.toggle("list", "a");
    const val = ctrl.getSnapshot("list").value;
    expect(val).toEqual({ from: "a" });
  });

  it("toggle on disabled key that is already selected deselects it", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", {
      mode: "multiple",
      keys: ["a", "b", "c"],
      disabledKeys: ["b"],
      allowDisabledSelection: false,
    });
    ctrl.replace("list", "a");
    ctrl.toggle("list", "b");
    expect(ctrl.isSelected("list", "b")).toBe(false);
  });

  it("toggle on disabled key that is not selected does nothing", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", {
      mode: "multiple",
      keys: ["a", "b", "c"],
      disabledKeys: ["b"],
    });
    ctrl.toggle("list", "b");
    expect(ctrl.isSelected("list", "b")).toBe(false);
  });

  it("toggle in single mode replaces when not selected", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", { mode: "single", keys: ["a", "b", "c"] });
    ctrl.replace("list", "a");
    ctrl.toggle("list", "b");
    expect(ctrl.getSnapshot("list").value).toBe("b");
  });

  it("toggle in single mode deselects when already selected", () => {
    const ctrl = new SelectionController();
    ctrl.create("list", { mode: "single", keys: ["a", "b", "c"] });
    ctrl.replace("list", "a");
    ctrl.toggle("list", "a");
    expect(ctrl.getSnapshot("list").value).toBeNull();
  });
});
