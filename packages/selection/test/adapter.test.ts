import { describe, expect, it, vi } from "vitest";
import { createControlledAdapter, createUncontrolledAdapter } from "../src/adapter.js";
import { SelectionController } from "../src/controller.js";

describe("@ailuracode/alpine-selection adapters", () => {
  it("controlled adapter notifies subscribers", () => {
    const listener = vi.fn();
    const adapter = createControlledAdapter({
      mode: "single",
      value: null,
      onChange: () => undefined,
    });
    adapter.subscribe(listener);
    adapter.setValue("a");
    expect(adapter.getValue()).toBe("a");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("uncontrolled adapter mirrors controller state", () => {
    const controller = new SelectionController();
    const adapter = createUncontrolledAdapter(controller, "list", {
      mode: "multiple",
      keys: ["a", "b"],
    });
    const listener = vi.fn();
    adapter.subscribe(listener);
    adapter.setValue(["a"]);
    expect(adapter.getValue()).toEqual(["a"]);
    expect(listener).toHaveBeenCalled();
  });
});
