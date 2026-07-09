/**
 * Tests for {@link createPortalRoot} — the SSR-safe portal helper.
 *
 * Verifies:
 * - Creates a `<div id="overlay-root">` when none exists.
 * - Returns the existing element when one with the id is present.
 * - Appends to `document.body`.
 * - Returns `null` under SSR (no `document`).
 * - Honours a custom id and className.
 */

import { createPortalRoot } from "@ailuracode/alpine-ui";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("createPortalRoot", () => {
  const originalDocument = globalThis.document;

  beforeEach(() => {
    if (typeof document !== "undefined") {
      document.body.innerHTML = "";
    }
  });

  afterEach(() => {
    if (typeof document !== "undefined") {
      document.body.innerHTML = "";
    }
    if (originalDocument === undefined) {
      (globalThis as { document?: unknown }).document = undefined;
    } else {
      (globalThis as { document: typeof originalDocument }).document = originalDocument;
    }
  });

  it('creates <div id="overlay-root"> when missing', () => {
    const root = createPortalRoot();
    expect(root).not.toBeNull();
    expect(root?.id).toBe("overlay-root");
    expect(root?.tagName).toBe("DIV");
    expect(document.getElementById("overlay-root")).toBe(root);
  });

  it("returns the existing element when one is present", () => {
    const existing = document.createElement("div");
    existing.id = "my-portal";
    document.body.appendChild(existing);
    const root = createPortalRoot({ id: "my-portal" });
    expect(root).toBe(existing);
  });

  it("honours custom className", () => {
    const root = createPortalRoot({ id: "stacked", className: "z-high fancy" });
    expect(root?.className).toBe("z-high fancy");
  });

  it("honours custom tag", () => {
    const root = createPortalRoot({ id: "semantic", as: "section" });
    expect(root?.tagName).toBe("SECTION");
  });

  it("returns null under SSR (no document)", () => {
    (globalThis as { document?: unknown }).document = undefined;
    expect(createPortalRoot()).toBeNull();
  });
});
