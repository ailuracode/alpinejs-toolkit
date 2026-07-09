/**
 * Tests for {@link OverlayController} core behavior.
 *
 * Covers:
 * - Initial state (`stack`, `count`, `root`).
 * - `configure()` defaults + idempotency.
 * - `register()` allocates ascending z-indices and emits `change`.
 * - Idempotent `register()` returns the same zIndex and does not
 *   re-emit.
 * - `unregister()` removes the entry and emits `change`.
 * - `unregister()` on an unknown id is a silent no-op.
 * - Empty-string `plugin` / `id` throws `INVALID_PLUGIN_ID`.
 * - `destroy()` is idempotent and clears the stack + listeners.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OVERLAY_SINGLETON_KEY, OverlayController } from "../src/controller.js";
import { OverlayError } from "../src/error.js";

describe("OverlayController", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("starts with empty stack, count=0, root=null", () => {
    const controller = new OverlayController();
    expect(controller.state.stack).toEqual([]);
    expect(controller.state.count).toBe(0);
    expect(controller.state.root).toBeNull();
  });

  it("uses the documented singleton key constant", () => {
    expect(OVERLAY_SINGLETON_KEY).toBe("@ailuracode/alpine-overlay/default");
  });

  it("register() allocates ascending z-indices from baseZIndex + step", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    const z0 = controller.register("dialog", "a");
    const z1 = controller.register("menu", "b");
    const z2 = controller.register("tooltip", "c");
    expect(z0).toBe(1000);
    expect(z1).toBe(1010);
    expect(z2).toBe(1020);
    expect(controller.state.stack.map((entry) => entry.zIndex)).toEqual([1000, 1010, 1020]);
    expect(controller.state.count).toBe(3);
  });

  it("register() is idempotent for the same (plugin, id)", () => {
    const controller = new OverlayController();
    const first = controller.register("dialog", "a");
    const listener = vi.fn();
    controller.on("change", listener);

    const second = controller.register("dialog", "a");

    expect(second).toBe(first);
    expect(controller.state.stack).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it("unregister() removes the entry and emits 'change' once", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    const listener = vi.fn();
    controller.on("change", listener);

    controller.unregister("dialog", "a");

    expect(controller.state.stack).toEqual([]);
    expect(controller.state.count).toBe(0);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ action: "unregister" });
  });

  it("unregister() on an unknown id is a silent no-op", () => {
    const controller = new OverlayController();
    const listener = vi.fn();
    controller.on("change", listener);

    controller.unregister("dialog", "never-registered");

    expect(listener).not.toHaveBeenCalled();
    expect(controller.state.stack).toEqual([]);
  });

  it("register() throws INVALID_PLUGIN_ID on empty plugin", () => {
    const controller = new OverlayController();
    expect(() => controller.register("", "a")).toThrow(OverlayError);
    expect(() => controller.register("", "a")).toThrow(/plugin/i);
  });

  it("register() throws INVALID_PLUGIN_ID on empty id", () => {
    const controller = new OverlayController();
    expect(() => controller.register("dialog", "")).toThrow(OverlayError);
    expect(() => controller.register("dialog", "")).toThrow(/id/i);
  });

  it("configure() with new defaults on empty stack applies in place", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    controller.configure({ baseZIndex: 2000, step: 20 });
    expect(controller.state.baseZIndex).toBe(2000);
    expect(controller.state.step).toBe(20);
  });

  it("configure() with conflicting defaults on a non-empty stack throws", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    controller.register("dialog", "a");
    expect(() => controller.configure({ baseZIndex: 2000 })).toThrow(OverlayError);
    expect(() => controller.configure({ baseZIndex: 2000 })).toThrow(/re-configure/);
  });

  it("destroy() is idempotent and clears the stack", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.register("dialog", "b");
    controller.destroy();
    expect(() => controller.state).toThrow(OverlayError);

    // Second destroy is a no-op (does not throw, does not crash).
    expect(() => controller.destroy()).not.toThrow();
  });

  it("mount() is idempotent", () => {
    const controller = new OverlayController();
    expect(() => controller.mount()).not.toThrow();
    expect(() => controller.mount()).not.toThrow();
  });
});
