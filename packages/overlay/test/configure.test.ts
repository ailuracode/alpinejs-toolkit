/**
 * Tests for {@link OverlayController.configure}.
 *
 * Covers:
 * - Default `baseZIndex` (1000) and `step` (10) applied on first
 *   call.
 * - Idempotent: second `configure()` with the same options does
 *   not allocate slots / change z-index scale.
 * - String selector resolves to the matching element (and creates
 *   one when absent).
 * - `HTMLElement` input is returned unchanged without `querySelector`.
 * - Lazy portal root materialization: `register()` before
 *   `configure()` still works.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OverlayController } from "../src/controller.js";

describe("OverlayController.configure", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("applies defaults on first call", () => {
    const controller = new OverlayController();
    controller.configure({});
    expect(controller.state.baseZIndex).toBe(1000);
    expect(controller.state.step).toBe(10);
  });

  it("applies explicit baseZIndex + step", () => {
    const controller = new OverlayController();
    controller.configure({ baseZIndex: 2000, step: 20 });
    expect(controller.state.baseZIndex).toBe(2000);
    expect(controller.state.step).toBe(20);
  });

  it("configure() twice with same options is idempotent", () => {
    const controller = new OverlayController({ baseZIndex: 2000, step: 20 });
    controller.configure({ baseZIndex: 2000, step: 20 });
    expect(controller.state.baseZIndex).toBe(2000);
    expect(controller.state.step).toBe(20);
  });

  it("configure() resolves a string selector to an existing element", () => {
    const existing = document.createElement("div");
    existing.id = "my-root";
    document.body.appendChild(existing);
    const controller = new OverlayController();
    controller.configure({ root: "#my-root" });
    expect(controller.state.root).toBe(existing);
  });

  it("configure() creates the portal element when the selector is missing", () => {
    const controller = new OverlayController();
    controller.configure({ root: "#freshly-created" });
    expect(controller.state.root).not.toBeNull();
    expect(controller.state.root?.id).toBe("freshly-created");
    expect(document.getElementById("freshly-created")).toBe(controller.state.root);
  });

  it("configure() accepts an HTMLElement without querySelector", () => {
    const el = document.createElement("section");
    el.id = "explicit-root";
    document.body.appendChild(el);
    const controller = new OverlayController();
    controller.configure({ root: el });
    expect(controller.state.root).toBe(el);
  });

  it("register() before configure() allocates a slot lazily", () => {
    const controller = new OverlayController();
    const z = controller.register("dialog", "lazy");
    expect(z).toBe(1000);
    expect(controller.state.stack).toHaveLength(1);
  });

  it("rejects negative baseZIndex", () => {
    const controller = new OverlayController();
    expect(() => controller.configure({ baseZIndex: -1 })).toThrow();
  });

  it("rejects step = 0", () => {
    const controller = new OverlayController();
    expect(() => controller.configure({ step: 0 })).toThrow();
  });
});
