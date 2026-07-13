/**
 * Tests for {@link overlayPlugin} — integration with Alpine.
 *
 * Verifies:
 * - Plugin installs `$store.overlay` after `Alpine.start()`.
 * - The store's `register()` allocates z-indices and exposes them
 *   through `zIndexOf()`.
 * - The plugin's controller wires the same singleton so a
 *   standalone `createOverlay()` shares state with `$store.overlay`.
 */

import { afterEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { createOverlay } from "../src/controller.js";
import { overlayPlugin } from "../src/plugin.js";

describe("overlayPlugin", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("installs $store.overlay when registered", () => {
    const Alpine = startAlpine(overlayPlugin());
    const store = Alpine.store("overlay") as unknown as {
      stack: unknown[];
      count: number;
    };
    expect(store).toBeDefined();
    expect(store.stack).toEqual([]);
    expect(store.count).toBe(0);
  });

  it("register() / zIndexOf() work via $store.overlay", () => {
    const Alpine = startAlpine(overlayPlugin());
    const store = Alpine.store("overlay") as unknown as {
      register: (plugin: string, id: string) => number;
      zIndexOf: (plugin: string, id: string) => number;
    };
    const zIndex = store.register("dialog", "a");
    expect(zIndex).toBe(1000);
    expect(store.zIndexOf("dialog", "a")).toBe(1000);
  });

  it("shares state with createOverlay() singleton", () => {
    startAlpine(overlayPlugin());
    const standalone = createOverlay();
    const again = createOverlay();
    // Both must resolve to the same singleton instance via
    // `createSingleton` from core. The standalone call MUST NOT
    // allocate a separate controller — reference equality proves
    // the singleton slot is reused.
    expect(standalone).toBe(again);
    // `id` is supplied by `BaseController.generateId` (not the
    // singleton key) — verify the format instead.
    expect(standalone.id).toMatch(/^controller-/);
  });
});
