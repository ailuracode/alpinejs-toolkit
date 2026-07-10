/**
 * Tests for the overlay plugin's portal root lifecycle.
 *
 * This file exists because `x-teleport="#overlay-root"` in
 * @ailuracode/alpine-overlay's consumer templates MUST find its
 * target by the time Alpine.start() processes the DOM. If
 * `#overlay-root` doesn't exist yet, x-teleport is a silent
 * no-op and the teleported content stays inline at the source
 * location — which is a subtle UI bug.
 *
 * The fix is that `createOverlay()` calls `controller.mount()`
 * during plugin construction, which in turn runs `configure({})`
 * that resolves / creates `#overlay-root` before Alpine.start()
 * ever fires.
 *
 * These tests pin that behavior so a future refactor cannot break it.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createOverlay, OverlayController } from "../src/controller.js";

describe("Overlay portal root initialization", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    // The overlay controller is a process-wide singleton; reset
    // the slot and explicitly destroy the prior instance so each
    // test starts from a clean slate.
    const existing = document.getElementById("overlay-root");
    if (existing) {
      existing.remove();
    }
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mount() resolves `#overlay-root` on first call", () => {
    const controller = new OverlayController();
    expect(document.getElementById("overlay-root")).toBeNull();
    controller.mount();
    const root = document.getElementById("overlay-root");
    expect(root).not.toBeNull();
    expect(root?.parentElement).toBe(document.body);
    expect(controller.state.root).toBe(root);
  });

  it("mount() does not duplicate `#overlay-root` on a second mount()", () => {
    const controller = new OverlayController();
    controller.mount();
    const first = document.getElementById("overlay-root");
    controller.mount();
    const after = document.getElementById("overlay-root");
    expect(after).toBe(first);
    expect(document.querySelectorAll("#overlay-root")).toHaveLength(1);
  });

  it("createOverlay() (the plugin factory) eagerly creates the portal root", () => {
    expect(document.getElementById("overlay-root")).toBeNull();
    const controller = createOverlay();
    const root = document.getElementById("overlay-root");
    expect(root).not.toBeNull();
    expect(root?.parentElement).toBe(document.body);
    expect(controller.state.root).toBe(root);
  });

  it("configure({ root: '#explicit' }) before Alpine.start() uses the explicit id", () => {
    const explicit = document.createElement("div");
    explicit.id = "my-custom-portal";
    document.body.appendChild(explicit);
    const controller = new OverlayController({ root: "#my-custom-portal" });
    controller.mount();
    expect(controller.state.root).toBe(explicit);
    // The default `overlay-root` must NOT be created when the
    // consumer picks their own id — otherwise SSR HTML ships a
    // sibling element it never uses.
    expect(document.getElementById("overlay-root")).toBeNull();
  });
});
