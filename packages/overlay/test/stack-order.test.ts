/**
 * Tests for stack ordering invariants.
 *
 * Stack must be sorted by z-index ascending at all times. The last
 * element is the top of the stack (matches OS-level modal
 * stacking).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OverlayController } from "../src/controller.js";

describe("OverlayController stack order", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("stack is empty after construction", () => {
    const controller = new OverlayController();
    expect(controller.state.stack).toEqual([]);
  });

  it("stack is sorted by z-index ascending after sequential registers", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    controller.register("dialog", "a");
    controller.register("menu", "b");
    controller.register("tooltip", "c");
    const zIndices = controller.state.stack.map((entry) => entry.zIndex);
    expect(zIndices).toEqual([1000, 1010, 1020]);
  });

  it("the last element is the top of the stack", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.register("dialog", "b");
    const top = controller.state.stack[controller.state.stack.length - 1];
    expect(top?.plugin).toBe("dialog");
    expect(top?.id).toBe("b");
  });

  it("after unregister of the top entry, the previous top becomes last", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.register("dialog", "b");
    controller.unregister("dialog", "b");
    const top = controller.state.stack[controller.state.stack.length - 1];
    expect(top?.plugin).toBe("dialog");
    expect(top?.id).toBe("a");
  });

  it("zIndex values are non-decreasing from index 0 to length-1", () => {
    const controller = new OverlayController({ baseZIndex: 1000, step: 7 });
    for (let i = 0; i < 10; i += 1) {
      controller.register(`plugin-${i}`, `id-${i}`);
    }
    const zIndices = controller.state.stack.map((entry) => entry.zIndex);
    for (let i = 1; i < zIndices.length; i += 1) {
      const previous = zIndices[i - 1];
      const current = zIndices[i];
      expect(current).toBeDefined();
      expect(previous).toBeDefined();
      if (current !== undefined && previous !== undefined) {
        expect(current).toBeGreaterThanOrEqual(previous);
      }
    }
  });

  it("each entry carries the opening plugin / id / zIndex / openedAt", () => {
    const before = Date.now();
    const controller = new OverlayController();
    controller.register("dialog", "a");
    const after = Date.now();
    const entry = controller.state.stack[0];
    expect(entry).toBeDefined();
    if (entry) {
      expect(entry.plugin).toBe("dialog");
      expect(entry.id).toBe("a");
      expect(entry.zIndex).toBe(1000);
      expect(entry.openedAt).toBeGreaterThanOrEqual(before);
      expect(entry.openedAt).toBeLessThanOrEqual(after);
    }
  });
});
