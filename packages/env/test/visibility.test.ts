import { describe, expect, it } from "vitest";
import { readVisibilityState, VISIBILITY_STATES } from "../src/internal/visibility.js";

describe("env/internal/visibility", () => {
  it("VISIBILITY_STATES contains all expected states", () => {
    expect(VISIBILITY_STATES).toContain("visible");
    expect(VISIBILITY_STATES).toContain("hidden");
    expect(VISIBILITY_STATES).toContain("prerender");
  });

  it("reads from injected doc", () => {
    const doc = { hidden: true, visibilityState: "hidden" as const };
    const snap = readVisibilityState(doc);
    expect(snap.isVisible).toBe(false);
    expect(snap.isHidden).toBe(true);
    expect(snap.state).toBe("hidden");
  });

  it("reads from injected doc when visible", () => {
    const doc = { hidden: false, visibilityState: "visible" as const };
    const snap = readVisibilityState(doc);
    expect(snap.isVisible).toBe(true);
    expect(snap.isHidden).toBe(false);
    expect(snap.state).toBe("visible");
  });

  it("returns visible default when document is undefined", () => {
    const originalDocument = (globalThis as Record<string, unknown>).document;
    (globalThis as Record<string, unknown>).document = undefined;
    const snap = readVisibilityState();
    expect(snap.isVisible).toBe(true);
    expect(snap.isHidden).toBe(false);
    expect(snap.state).toBe("visible");
    (globalThis as Record<string, unknown>).document = originalDocument;
  });

  it("reads from global document when no doc injected", () => {
    const snap = readVisibilityState();
    expect(snap.state).toBeDefined();
    expect(typeof snap.isVisible).toBe("boolean");
  });
});
