/**
 * Lifecycle spec — mount / destroy idempotency + cleanup verification.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollController } from "../src/controller";
import type { ScrollChangeDetail } from "../src/types";

describe("ScrollController — lifecycle", () => {
  let controller: ScrollController;
  beforeEach(() => {
    controller = new ScrollController();
  });
  afterEach(() => {
    if (!controller.isDestroyed) {
      controller.destroy();
    }
  });

  it("post-destroy commands throw ToolkitError(CONTROLLER_DESTROYED)", () => {
    controller.mount();
    controller.destroy();
    expect(() => controller.lockWithHandle("modal")).toThrow();
    expect(() => controller.unlock("nope")).toThrow();
    expect(() => controller.toTop()).toThrow();
    expect(() => controller.toBottom()).toThrow();
    expect(() => controller.by({ y: 100 })).toThrow();
    expect(() => controller.scrollIntoView({ x: 0, y: 0 })).toThrow();
    expect(() => controller.registerSection("x")).toThrow();
    expect(() => controller.unregisterSection("x")).toThrow();
    expect(() => controller.reset()).toThrow();
  });

  it("post-destroy emits nothing", () => {
    controller.mount();
    const events: ScrollChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    controller.destroy();
    // Per design: #assertAlive throws ToolkitError('CONTROLLER_DESTROYED')
    // for commands invoked after destroy. The change event is never
    // emitted because the throw aborts the call.
    expect(() => controller.toTop("after destroy")).toThrow();
    expect(events.length).toBe(0);
  });

  it("multiple mount() calls only register scroll listener once", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    controller.mount();
    const before = addSpy.mock.calls.filter(([event]) => event === "scroll").length;
    controller.mount();
    const after = addSpy.mock.calls.filter(([event]) => event === "scroll").length;
    expect(after).toBe(before);
    addSpy.mockRestore();
  });

  it("destroy() clears pending rAF (no leaks)", () => {
    controller.mount();
    controller.destroy();
    // After destroy, scroll events must not produce further emissions.
    const events: ScrollChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    window.dispatchEvent(new Event("scroll"));
    expect(events.length).toBe(0);
  });

  it("destroy() clears scrollbar-gap compensation", () => {
    controller.mount();
    controller.lockWithHandle("modal");
    document.documentElement.style.setProperty("--ailura-scrollbar-gap", "12px");
    controller.destroy();
    // destroy() removes the CSS variable.
    expect(document.documentElement.style.getPropertyValue("--ailura-scrollbar-gap")).toBe("");
  });
});
