/**
 * Tests for {@link OverlayController.register} /
 * {@link OverlayController.unregister}.
 *
 * Covers:
 * - First `register()` returns `baseZIndex`.
 * - Idempotent `register()` returns the same `zIndex` without
 *   emitting or reordering the stack.
 * - `unregister()` of an unknown pair is silent.
 * - Empty `plugin` or `id` throws `OverlayError(INVALID_PLUGIN_ID)`.
 * - After `unregister()`, re-`register()` of the same id gets the
 *   NEXT z-index (burned slots).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverlayController } from "../src/controller.js";
import { OverlayError } from "../src/error.js";

describe("OverlayController register / unregister", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("first register returns baseZIndex", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    expect(controller.register("dialog", "a")).toBe(1000);
  });

  it("idempotent register does NOT re-emit 'change'", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    const listener = vi.fn();
    controller.on("change", listener);

    controller.register("dialog", "a");
    controller.register("dialog", "a");
    controller.register("dialog", "a");

    expect(listener).not.toHaveBeenCalled();
    expect(controller.state.stack).toHaveLength(1);
  });

  it("idempotent register returns the existing zIndex", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    controller.register("dialog", "a");
    controller.register("dialog", "b");
    const second = controller.register("dialog", "a");
    expect(second).toBe(1000);
    expect(controller.state.stack.map((e) => e.zIndex)).toEqual([1000, 1010]);
  });

  it("unregister() of an unknown pair is a silent no-op", () => {
    const controller = new OverlayController();
    expect(() => controller.unregister("dialog", "z")).not.toThrow();
  });

  it("re-register after unregister returns the next slot (burned)", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    expect(controller.register("dialog", "a")).toBe(1000);
    controller.unregister("dialog", "a");
    expect(controller.register("dialog", "a")).toBe(1010);
  });

  it("throws INVALID_PLUGIN_ID on empty plugin", () => {
    const controller = new OverlayController();
    expect(() => controller.register("", "a")).toThrow(OverlayError);
  });

  it("throws INVALID_PLUGIN_ID on empty id", () => {
    const controller = new OverlayController();
    expect(() => controller.register("dialog", "")).toThrow(OverlayError);
  });

  it("register after destroy throws", () => {
    const controller = new OverlayController();
    controller.destroy();
    expect(() => controller.register("dialog", "a")).toThrow(OverlayError);
  });

  it("unregister after destroy is a no-op (does not throw)", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.destroy();
    expect(() => controller.unregister("dialog", "a")).not.toThrow();
  });
});
