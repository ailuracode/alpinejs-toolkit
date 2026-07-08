/**
 * Cross-tab synchronization tests for `@ailuracode/alpine-theme`.
 *
 * Verifies the localStorage adapter's `storage` event wiring + the
 * manager's `crossTab: true` opt-in behavior. Each test fires a
 * synthetic StorageEvent so it does not depend on real cross-tab
 * state.
 */

import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { createTheme } from "../src/index";

function fireStorage(key: string, newValue: string | null): void {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
}

describe("cross-tab synchronization", () => {
  it("updates the manager when another tab changes the value", () => {
    const theme = createTheme({ defaultTheme: "light" });
    assert.equal(theme.current, "light");

    fireStorage("theme", "dark");
    assert.equal(theme.current, "dark");
    assert.equal(theme.resolved, "dark");

    theme.destroy();
  });

  it('emits a transition with source: "storage"', () => {
    const theme = createTheme({ defaultTheme: "light" });
    let received: { source: string; current: string } | null = null;
    theme.on("change", (detail) => {
      if (detail.source === "storage") {
        received = { source: detail.source, current: detail.current };
      }
    });

    fireStorage("theme", "system");
    assert.deepEqual(received, { source: "storage", current: "system" });
    theme.destroy();
  });

  it("does not write the value back to storage on cross-tab update", () => {
    const theme = createTheme({ defaultTheme: "light" });
    fireStorage("theme", "dark");
    // The manager updated its state from the event, but should NOT
    // re-write the same value (no feedback loop).
    assert.equal(localStorage.getItem("theme"), null);
    theme.destroy();
  });

  it("does not fire on storage events for unrelated keys", () => {
    const theme = createTheme({ defaultTheme: "light" });
    let calls = 0;
    theme.on("change", (detail) => {
      if (detail.source === "storage") {
        calls += 1;
      }
    });

    fireStorage("other-key", "dark");
    assert.equal(calls, 0);
    theme.destroy();
  });

  it("is opt-out via crossTab: false", () => {
    const theme = createTheme({ defaultTheme: "light", crossTab: false });
    fireStorage("theme", "dark");
    // Cross-tab disabled — manager ignores the event.
    assert.equal(theme.current, "light");
    theme.destroy();
  });

  it("removes the storage listener on destroy()", () => {
    const theme = createTheme({ defaultTheme: "light" });
    let calls = 0;
    theme.on("change", (detail) => {
      if (detail.source === "storage") {
        calls += 1;
      }
    });
    theme.destroy();
    fireStorage("theme", "dark");
    assert.equal(calls, 0);
  });

  it("does not loop when the manager itself writes the value", () => {
    const theme = createTheme({ defaultTheme: "light" });
    let storageEvents = 0;
    theme.on("change", (detail) => {
      if (detail.source === "storage") {
        storageEvents += 1;
      }
    });
    // The manager writes the value as part of `set()`.
    theme.set("dark");
    // A real browser would echo this back via the storage event. We
    // simulate the echo here to verify the manager suppresses it.
    fireStorage("theme", "dark");
    assert.equal(storageEvents, 0);
    theme.destroy();
  });

  it("applies the default when another tab clears the storage key", () => {
    const theme = createTheme({ defaultTheme: "system" });
    // Move off the default so the cross-tab clear triggers an actual
    // transition (applySet short-circuits when value === current and
    // the source is not `'reset'`).
    theme.set("dark");
    let received: { source: string; current: string } | null = null;
    theme.on("change", (detail) => {
      if (detail.source === "storage") {
        received = { source: detail.source, current: detail.current };
      }
    });

    fireStorage("theme", null);
    assert.equal(theme.current, "system");
    assert.deepEqual(received, { source: "storage", current: "system" });
    theme.destroy();
  });
});
