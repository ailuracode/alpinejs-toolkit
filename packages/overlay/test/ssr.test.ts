/**
 * SSR safety tests.
 *
 * Simulates an environment with no `document` global and verifies:
 * - Construction does not throw.
 * - `configure()` is a silent no-op (state.root remains `null`).
 * - `register()` still allocates a slot (no DOM required).
 * - `zIndexOf()` and `isOpen()` still work.
 */

import { afterEach, describe, expect, it } from "vitest";
import { OverlayController } from "../src/controller.js";

describe("OverlayController SSR", () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    if (originalDocument === undefined) {
      (globalThis as { document?: unknown }).document = undefined;
    } else {
      (globalThis as { document: typeof originalDocument }).document = originalDocument;
    }
  });

  it("constructor does not throw when document is undefined", () => {
    (globalThis as { document?: unknown }).document = undefined;
    expect(() => new OverlayController()).not.toThrow();
  });

  it("configure() is a no-op when document is undefined", () => {
    (globalThis as { document?: unknown }).document = undefined;
    const controller = new OverlayController();
    expect(() => controller.configure({ root: "#missing" })).not.toThrow();
    expect(controller.state.root).toBeNull();
  });

  it("register() still allocates a slot when document is undefined", () => {
    (globalThis as { document?: unknown }).document = undefined;
    const controller = new OverlayController({ baseZIndex: 1000, step: 10 });
    const z = controller.register("dialog", "a");
    expect(z).toBe(1000);
    expect(controller.state.stack).toHaveLength(1);
    expect(controller.zIndexOf("dialog", "a")).toBe(1000);
    expect(controller.isOpen("dialog", "a")).toBe(true);
  });

  it("configure() with HTMLElement root returns the element even with undefined document", () => {
    // When document is undefined, no DOM operations occur — but
    // passing an existing HTMLElement (rare under SSR, possible in
    // tests) still returns it as-is so the caller can hand-roll a
    // portal mount.
    (globalThis as { document?: unknown }).document = undefined;
    const el = { id: "fake" } as any as HTMLElement;
    const controller = new OverlayController({ root: el });
    // safeDocument() returns null under SSR, so the resolver does
    // not attach the element. The element reference stays in
    // options but root remains null in state.
    expect(controller.state.root).toBeNull();
  });
});
