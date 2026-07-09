/**
 * Tests for {@link OverlayController} query methods.
 *
 * Covers:
 * - `zIndexOf(plugin, id)` returns the allocated number.
 * - `zIndexOf(plugin, id)` returns `null` for unknown pairs.
 * - `isOpen(plugin, id)` returns `true` for registered, `false`
 *   for unknown.
 * - `count` always equals `stack.length`.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OverlayController } from "../src/controller.js";

describe("OverlayController queries", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("zIndexOf returns the allocated number", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    expect(controller.zIndexOf("dialog", "a")).toBe(1000);
  });

  it("zIndexOf returns null for unknown pairs", () => {
    const controller = new OverlayController();
    expect(controller.zIndexOf("dialog", "never")).toBeNull();
  });

  it("isOpen returns true for registered pairs", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    expect(controller.isOpen("dialog", "a")).toBe(true);
  });

  it("isOpen returns false for unknown pairs", () => {
    const controller = new OverlayController();
    expect(controller.isOpen("menu", "b")).toBe(false);
  });

  it("isOpen returns false after unregister", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.unregister("dialog", "a");
    expect(controller.isOpen("dialog", "a")).toBe(false);
  });

  it("count invariant: count === stack.length", () => {
    const controller = new OverlayController();
    expect(controller.state.count).toBe(controller.state.stack.length);
    controller.register("dialog", "a");
    expect(controller.state.count).toBe(1);
    controller.register("dialog", "b");
    expect(controller.state.count).toBe(2);
    controller.unregister("dialog", "a");
    expect(controller.state.count).toBe(1);
    controller.unregister("dialog", "b");
    expect(controller.state.count).toBe(0);
  });

  it("zIndexOf after destroy returns null", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.destroy();
    expect(controller.zIndexOf("dialog", "a")).toBeNull();
  });

  it("isOpen after destroy returns false", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    controller.destroy();
    expect(controller.isOpen("dialog", "a")).toBe(false);
  });
});
