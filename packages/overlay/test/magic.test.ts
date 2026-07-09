/**
 * Tests for the `$overlay` magic facade.
 *
 * Verifies:
 * - Magic is registered when the plugin runs.
 * - Magic returns the same reactive proxy the store uses.
 * - `$overlay.zIndexOf()` and `$overlay.isOpen()` match
 *   `$store.overlay.zIndexOf()` / `$store.overlay.isOpen()`.
 * - Method calls on the magic delegate to the controller (single
 *   source of truth).
 *
 * The mock harness in `test/mock-alpine.ts` does NOT support the
 * `store() -> ReactiveStore` round-trip, so the magic test
 * exercises the real Alpine plugin and reads the facade off a
 * custom `x-data` scope that captures `$overlay` in its `init()`.
 */

import Alpine from "alpinejs";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { overlayPlugin } from "../src/plugin.js";
import type { OverlayMagicFacade } from "../src/types.js";

let alpineStarted = false;

function setupOverlayAlpine(): void {
  Alpine.plugin(overlayPlugin());
  if (!alpineStarted) {
    Alpine.start();
    alpineStarted = true;
  }
}

interface MagicWindow {
  __facade?: OverlayMagicFacade;
}

describe("overlay $overlay magic", () => {
  beforeAll(() => {
    // No-op — setupOverlayAlpine is invoked per test so the body
    // is set BEFORE Alpine.start() scans it.
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is registered with the overlay plugin and resolves to a facade", async () => {
    document.body.innerHTML = `
      <div x-data="{ captured: null, init() { this.captured = $overlay; } }">
        <span id="count" x-text="captured ? String(captured.count) : 'no-magic'"></span>
        <span id="has-register" x-text="captured && typeof captured.register === 'function' ? 'yes' : 'no'"></span>
      </div>
    `;
    setupOverlayAlpine();
    await Alpine.nextTick();
    await Alpine.nextTick();
    expect(document.getElementById("count")?.textContent).toBe("0");
    expect(document.getElementById("has-register")?.textContent).toBe("yes");
  });

  it("returns a facade with read-only fields + methods", async () => {
    document.body.innerHTML = `
      <div x-data="{ init() { window.__facade = $overlay; } }"></div>
    `;
    setupOverlayAlpine();
    await Alpine.nextTick();
    const facade = (window as unknown as MagicWindow).__facade ?? null;
    expect(facade).not.toBeNull();
    if (!facade) {
      return;
    }
    expect(typeof facade.register).toBe("function");
    expect(typeof facade.unregister).toBe("function");
    expect(typeof facade.zIndexOf).toBe("function");
    expect(typeof facade.isOpen).toBe("function");
    expect(typeof facade.on).toBe("function");
    expect(facade.stack).toEqual([]);
    expect(facade.count).toBe(0);
  });

  it("zIndexOf returns null for unknown pairs", async () => {
    document.body.innerHTML = `
      <div x-data="{ init() { window.__facade = $overlay; } }"></div>
    `;
    setupOverlayAlpine();
    await Alpine.nextTick();
    const facade = (window as unknown as MagicWindow).__facade ?? null;
    expect(facade?.zIndexOf("dialog", "missing")).toBeNull();
  });

  it("returns the SAME reference as Alpine.store('overlay') (ADR-5 reactive bridge)", async () => {
    // Alpine wraps the plain-object store in a reactive proxy on
    // .store(name, value) install. Both `$store.overlay` and
    // `$overlay` MUST resolve to the same proxy — otherwise Alpine
    // would re-render one but not the other. Verify the contract.
    document.body.innerHTML = `
      <div x-data="{ init() { window.__facade = $overlay; } }"></div>
    `;
    setupOverlayAlpine();
    await Alpine.nextTick();
    const facade = (window as unknown as MagicWindow).__facade ?? null;
    const storeRef = Alpine.store("overlay");
    expect(facade).not.toBeNull();
    if (!facade) {
      return;
    }
    // Reference equality — `toBe` is strict identity.
    expect(facade).toBe(storeRef);
    // Sanity: every expected method is present on the returned
    // magic reference (so `$overlay.configure(...)` etc. all work).
    expect(typeof facade.configure).toBe("function");
    expect(typeof facade.register).toBe("function");
    expect(typeof facade.unregister).toBe("function");
    expect(typeof facade.zIndexOf).toBe("function");
    expect(typeof facade.isOpen).toBe("function");
  });
});
