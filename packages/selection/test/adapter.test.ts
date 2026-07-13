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

  it("uncontrolled adapter subscribe returns unsubscribe function", () => {
    const controller = new SelectionController();
    const adapter = createUncontrolledAdapter(controller, "list", {
      mode: "single",
      keys: ["a", "b"],
    });
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);
    adapter.setValue("a");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    adapter.setValue("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("uncontrolled adapter does not recreate instance on second getValue", () => {
    const controller = new SelectionController();
    const createSpy = vi.spyOn(controller, "create");
    const adapter = createUncontrolledAdapter(controller, "list", {
      mode: "single",
      keys: ["a", "b"],
    });
    adapter.getValue();
    adapter.getValue();
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it("uncontrolled adapter only notifies for matching instance", () => {
    const controller = new SelectionController();
    controller.create("other", { mode: "single", keys: ["x"] });
    const adapter = createUncontrolledAdapter(controller, "list", {
      mode: "single",
      keys: ["a", "b"],
    });
    const listener = vi.fn();
    adapter.subscribe(listener);
    controller.replace("other", "x");
    expect(listener).not.toHaveBeenCalled();
    controller.replace("list", "a");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("controlled adapter unsubscribe removes listener", () => {
    const adapter = createControlledAdapter({
      mode: "single",
      value: null,
      onChange: () => undefined,
    });
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);
    adapter.setValue("a");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    adapter.setValue("b");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("controlled adapter isControlled flag is true", () => {
    const adapter = createControlledAdapter({
      mode: "single",
      value: null,
      onChange: () => undefined,
    });
    expect(adapter.isControlled).toBe(true);
  });

  it("uncontrolled adapter isControlled flag is false", () => {
    const controller = new SelectionController();
    const adapter = createUncontrolledAdapter(controller, "list");
    expect(adapter.isControlled).toBe(false);
  });
});
