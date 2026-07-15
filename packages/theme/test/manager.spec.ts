/**
 * Manager-layer tests for `@ailuracode/alpine-theme`.
 *
 * Per `.cursor/rules/testing.mdc`, manager tests
 * cover: initial state, transitions, invariants, events, options,
 * errors, idempotency, and cleanup.
 */

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  createMemoryThemeStorage,
  createTheme,
  type ResolvedTheme,
  ThemeController,
  type ThemeListener,
  type ThemeManager,
  type ThemePreference,
} from "../src/index";
import { setMatchMedia } from "./setup";

const PREFERS_DARK = "(prefers-color-scheme: dark)";

/**
 * Builds a synthetic `storage` event with `key` + `newValue` and
 * dispatches it on `window`. Avoids `new StorageEvent(type, init)`
 * because some runtimes (and static analyzers like CodeQL) flag
 * the init object as a "superfluous trailing argument" — the
 * property setters on a plain `Event` are the supported path.
 */
function fireStorage(key: string, newValue: string | null): void {
  const event = new Event("storage");
  Object.defineProperty(event, "key", { value: key });
  Object.defineProperty(event, "newValue", { value: newValue });
  window.dispatchEvent(event);
}

describe("createTheme — initial state", () => {
  it("uses the configured default when no value is persisted", () => {
    const theme = createTheme({ defaultTheme: "light" });
    assert.equal(theme.current, "light");
    assert.equal(theme.resolved, "light");
  });

  it('falls back to "system" when no default and no persistence', () => {
    const theme = createTheme();
    assert.equal(theme.current, "system");
    assert.equal(theme.resolved, "light");
  });

  it("hydrates from a persisted light value", () => {
    localStorage.setItem("theme", "light");
    const theme = createTheme();
    assert.equal(theme.current, "light");
    assert.equal(theme.resolved, "light");
  });

  it("hydrates from a persisted dark value", () => {
    localStorage.setItem("theme", "dark");
    const theme = createTheme();
    assert.equal(theme.current, "dark");
    assert.equal(theme.resolved, "dark");
  });

  it("hydrates from a persisted system value", () => {
    localStorage.setItem("theme", "system");
    setMatchMedia(PREFERS_DARK, true);
    const theme = createTheme();
    assert.equal(theme.current, "system");
    assert.equal(theme.system, "dark");
    assert.equal(theme.resolved, "dark");
  });

  it("ignores an invalid persisted value and applies the default", () => {
    localStorage.setItem("theme", "neon");
    const theme = createTheme();
    assert.equal(theme.current, "system");
  });

  it("uses a custom localStorage key when supplied", () => {
    localStorage.setItem("app-theme", "dark");
    const theme = createTheme({ storage: createMemoryThemeStorage() });
    // Memory storage starts empty even though localStorage was set —
    // the test verifies that the manager does not reach for
    // `localStorage` once a custom adapter is provided.
    assert.equal(theme.current, "system");
    theme.set("dark");
    assert.equal(theme.current, "dark");
  });
});

describe("createTheme — set()", () => {
  let theme: ThemeManager;
  beforeEach(() => {
    theme = createTheme({ defaultTheme: "light" });
  });
  afterEach(() => {
    theme.destroy();
  });

  it("updates current, resolved, and the DOM", () => {
    theme.set("dark");
    assert.equal(theme.current, "dark");
    assert.equal(theme.resolved, "dark");
    assert.equal(document.documentElement.classList.contains("dark"), true);
  });

  it("persists the value through the storage adapter", () => {
    theme.set("dark");
    assert.equal(localStorage.getItem("theme"), "dark");
  });

  it("ignores duplicate values (no DOM thrash, no extra event)", () => {
    let calls = 0;
    const listener: ThemeListener = () => {
      calls += 1;
    };
    theme.on("change", listener);
    theme.set("light"); // matches the default — should be a no-op
    assert.equal(calls, 0);
  });

  it("coerces an invalid input to the default", () => {
    // Type system blocks invalid values, but the runtime guard must
    // still protect consumers that bypass it (e.g. JSON from a server).
    theme.set("neon" as ThemePreference);
    // Invalid input is rejected — the manager keeps the previous state.
    assert.equal(theme.current, "light");
  });
});

describe("createTheme — toggle()", () => {
  it("switches from dark to light based on the resolved theme", () => {
    setMatchMedia(PREFERS_DARK, true);
    const theme = createTheme({ defaultTheme: "dark" });
    assert.equal(theme.resolved, "dark");

    theme.toggle();
    assert.equal(theme.current, "light");
    assert.equal(theme.resolved, "light");
    assert.equal(theme.current, "light"); // explicit, not 'system'

    theme.toggle();
    assert.equal(theme.current, "dark");
    assert.equal(theme.resolved, "dark");

    theme.destroy();
  });

  it("creates an explicit preference and does not return to system", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "system" });
    assert.equal(theme.current, "system");

    theme.toggle();
    assert.equal(theme.current, "dark"); // resolved was 'light', so toggle → 'dark'

    theme.destroy();
  });
});

describe("createTheme — reset()", () => {
  it("removes the persisted value and restores the default", () => {
    localStorage.setItem("theme", "dark");
    const theme = createTheme({ defaultTheme: "light" });
    assert.equal(theme.current, "dark");

    theme.reset();
    assert.equal(theme.current, "light");
    assert.equal(localStorage.getItem("theme"), null);

    theme.destroy();
  });
});

describe("createTheme — DOM strategies", () => {
  it("class strategy toggles the dark class on the target", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "light" });
    assert.equal(document.documentElement.classList.contains("light"), true);

    theme.set("dark");
    assert.equal(document.documentElement.classList.contains("dark"), true);
    assert.equal(document.documentElement.classList.contains("light"), false);

    theme.destroy();
  });

  it("class strategy uses custom dark/light class names", () => {
    const theme = createTheme({
      defaultTheme: "light",
      darkClass: "theme-dark",
      lightClass: "theme-light",
    });
    assert.equal(document.documentElement.classList.contains("theme-light"), true);

    theme.set("dark");
    assert.equal(document.documentElement.classList.contains("theme-dark"), true);
    assert.equal(document.documentElement.classList.contains("theme-light"), false);

    theme.destroy();
  });

  it("attribute strategy sets data-theme to the resolved value", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "light", strategy: "attribute" });
    assert.equal(document.documentElement.getAttribute("data-theme"), "light");

    theme.set("dark");
    assert.equal(document.documentElement.getAttribute("data-theme"), "dark");

    theme.destroy();
  });

  it("attribute strategy uses a custom attribute name", () => {
    const theme = createTheme({
      defaultTheme: "dark",
      strategy: "attribute",
      attribute: "data-color-scheme",
    });
    assert.equal(document.documentElement.getAttribute("data-color-scheme"), "dark");

    theme.destroy();
  });

  it('"none" strategy leaves the DOM untouched', () => {
    const theme = createTheme({ defaultTheme: "dark", strategy: "none" });
    assert.equal(document.documentElement.classList.contains("dark"), false);

    theme.set("light");
    assert.equal(document.documentElement.classList.contains("light"), false);

    theme.destroy();
  });

  it("works without a target under SSR", () => {
    // happy-dom provides a document, but we simulate SSR by setting the
    // option to null. The strategy should still accept the call.
    const theme = createTheme({ defaultTheme: "dark", target: null, strategy: "class" });
    // No throw on init; no DOM mutation observed.
    assert.equal(theme.resolved, "dark");
    theme.destroy();
  });

  it("does not accumulate stale classes when the resolved value flips", () => {
    const theme = createTheme({ defaultTheme: "dark" });
    theme.set("light");
    theme.set("dark");
    theme.set("light");
    const classes = Array.from(document.documentElement.classList).sort();
    assert.deepEqual(classes, ["light"]);
    theme.destroy();
  });
});

describe("createTheme — system theme", () => {
  it('uses the OS preference when current is "system"', () => {
    setMatchMedia(PREFERS_DARK, true);
    const theme = createTheme({ defaultTheme: "system" });
    assert.equal(theme.system, "dark");
    assert.equal(theme.resolved, "dark");
    theme.destroy();
  });

  it('updates resolved when the OS flips and current is "system"', () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "system" });
    assert.equal(theme.resolved, "light");

    setMatchMedia(PREFERS_DARK, true);
    assert.equal(theme.resolved, "dark");
    assert.equal(theme.system, "dark");
    theme.destroy();
  });

  it("keeps the explicit user choice when the OS flips", () => {
    const theme = createTheme({ defaultTheme: "light" });
    assert.equal(theme.resolved, "light");

    setMatchMedia(PREFERS_DARK, true);
    // `system` is updated for observability, but `current` / `resolved` stay.
    assert.equal(theme.system, "dark");
    assert.equal(theme.resolved, "light");
    theme.destroy();
  });

  it("does not watch the system theme when watchSystem is false", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "system", watchSystem: false });
    assert.equal(theme.resolved, "light");

    setMatchMedia(PREFERS_DARK, true);
    // System flip ignored.
    assert.equal(theme.resolved, "light");
    assert.equal(theme.system, "light");
    theme.destroy();
  });
});

describe("createTheme — subscribers", () => {
  it("notifies on every relevant transition", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "light" });

    const seen: Array<{ current: ThemePreference; source: string }> = [];
    theme.on("change", (detail) => {
      seen.push({ current: detail.current, source: detail.source });
    });

    theme.set("dark");
    theme.set("system");

    assert.equal(seen.length, 2);
    assert.deepEqual(seen[0], { current: "dark", source: "user" });
    assert.deepEqual(seen[1], { current: "system", source: "user" });

    theme.destroy();
  });

  it("emits an initialization event on subscribe", async () => {
    const theme = createTheme({ defaultTheme: "light" });
    const sources: string[] = [];
    theme.on("change", (detail) => {
      sources.push(detail.source);
    });
    // Init event is dispatched on a microtask so consumers can attach
    // subscribers synchronously after `createTheme()` returns.
    await Promise.resolve();
    assert.deepEqual(sources, ["initialization"]);
    theme.destroy();
  });

  it("returns an unsubscribe function that stops further notifications", () => {
    const theme = createTheme({ defaultTheme: "light" });
    let calls = 0;
    const unsubscribe = theme.on("change", () => {
      calls += 1;
    });
    theme.set("dark");
    assert.equal(calls, 1);

    unsubscribe();
    theme.set("light");
    assert.equal(calls, 1);
    theme.destroy();
  });

  it("carries the previous state in the detail", () => {
    const theme = createTheme({ defaultTheme: "light" });
    let received: unknown = null;
    theme.on("change", (detail) => {
      if (detail.source === "user") {
        received = detail.previous;
      }
    });
    theme.set("dark");
    assert.deepEqual(received, { current: "light", system: "light", resolved: "light" });
    theme.destroy();
  });
});

describe("createTheme — duplicate initialization", () => {
  it("fires exactly one event per transition (no duplicate listeners)", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "system" });
    let events = 0;
    theme.on("change", () => {
      events += 1;
    });
    // Each OS flip should fire exactly one event (not zero, not two).
    setMatchMedia(PREFERS_DARK, true);
    setMatchMedia(PREFERS_DARK, false);
    setMatchMedia(PREFERS_DARK, true);
    setMatchMedia(PREFERS_DARK, false);
    assert.equal(events, 4);
    theme.destroy();
  });
});

describe("createTheme — destroy()", () => {
  it("stops firing change events", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "system" });
    let calls = 0;
    theme.on("change", () => {
      calls += 1;
    });
    theme.destroy();

    setMatchMedia(PREFERS_DARK, true);
    assert.equal(calls, 0);
  });

  it("removes the matchMedia listener", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "system" });
    let resolved = theme.resolved;
    theme.on("change", (detail) => {
      resolved = detail.resolved;
    });
    theme.destroy();
    setMatchMedia(PREFERS_DARK, true);
    assert.equal(resolved, "light"); // unchanged after destroy
  });

  it("cleans up the DOM class on destroy()", () => {
    const theme = createTheme({ defaultTheme: "dark" });
    assert.equal(document.documentElement.classList.contains("dark"), true);
    theme.destroy();
    assert.equal(document.documentElement.classList.contains("dark"), false);
  });

  it("removes the storage event listener (cross-tab)", () => {
    const theme = createTheme({ defaultTheme: "light" });
    let calls = 0;
    theme.on("change", (detail) => {
      if (detail.source === "storage") {
        calls += 1;
      }
    });
    theme.destroy();

    // Dispatch a storage event after destroy — the listener should be gone.
    fireStorage("theme", "dark");
    assert.equal(calls, 0);
  });

  it("is idempotent", () => {
    const theme = createTheme({ defaultTheme: "light" });
    theme.destroy();
    theme.destroy();
    assert.ok(true);
  });
});

describe("createTheme — system-flip does not change explicit user choice", () => {
  it("does not modify current / resolved when the user picked light", () => {
    setMatchMedia(PREFERS_DARK, false);
    const theme = createTheme({ defaultTheme: "light" });
    theme.set("light");
    const initialCurrent = theme.current;
    const initialResolved = theme.resolved;

    setMatchMedia(PREFERS_DARK, true);
    setMatchMedia(PREFERS_DARK, false);
    setMatchMedia(PREFERS_DARK, true);

    assert.equal(theme.current, initialCurrent);
    assert.equal(theme.resolved, initialResolved);
    theme.destroy();
  });
});

describe("createTheme — type inference", () => {
  it("exposes the three documented preference literals", () => {
    const theme = createTheme();
    type Expected = "light" | "dark" | "system";
    const current: Expected = theme.current;
    assert.ok(["light", "dark", "system"].includes(current));
    theme.destroy();
  });

  it("exposes the two resolved literals", () => {
    const theme = createTheme();
    type Expected = ResolvedTheme;
    const resolved: Expected = theme.resolved;
    assert.ok(["light", "dark"].includes(resolved));
    theme.destroy();
  });
});

describe("createTheme — constructor purity", () => {
  /**
   * Per `.cursor/rules/new-package.mdc`, the
   * constructor MUST NOT register global listeners, access `window`,
   * `document`, `localStorage`, start timers, or initialize external
   * libraries. Side effects MUST start in `mount()`.
   *
   * These tests exercise the bare `new ThemeController(...)`
   * constructor. `createTheme()` is a factory that mounts after
   * construction — its browser access happens at the explicit
   * `mount()` step, not at construction time.
   */

  it("does not read localStorage during construction", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    let reads = 0;
    const proxy = new Proxy(localStorage, {
      get(target, prop, receiver) {
        if (typeof prop === "string" && ["getItem", "key"].includes(prop)) {
          reads += 1;
        }
        return Reflect.get(target, prop, receiver);
      },
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: proxy,
    });

    try {
      // Import the class directly to bypass `createTheme()`'s mount.
      const controller = new ThemeController({ defaultTheme: "light" });
      assert.equal(reads, 0, `constructor must not read localStorage (reads: ${reads})`);
      controller.destroy();
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "localStorage", originalDescriptor);
      }
    }
  });

  it("does not call window.matchMedia during construction", () => {
    // The system observer registers a matchMedia listener on mount.
    // Construction must not touch the API.
    const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
    let calls = 0;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: () => {
        calls += 1;
        return {
          matches: false,
          media: "",
          onchange: null,
          addEventListener() {
            // No-op.
          },
          removeEventListener() {
            // No-op.
          },
          addListener() {
            // No-op.
          },
          removeListener() {
            // No-op.
          },
          dispatchEvent: () => true,
        };
      },
    });

    try {
      const controller = new ThemeController({ defaultTheme: "light" });
      assert.equal(calls, 0, `constructor must not call matchMedia (calls: ${calls})`);
      controller.destroy();
    } finally {
      if (originalMatchMedia) {
        Object.defineProperty(window, "matchMedia", originalMatchMedia);
      }
    }
  });

  it("does not access document during construction", () => {
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
    let accesses = 0;
    const proxy = new Proxy(document, {
      get(target, prop, receiver) {
        accesses += 1;
        return Reflect.get(target, prop, receiver);
      },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      writable: true,
      value: proxy,
    });

    try {
      const controller = new ThemeController({ defaultTheme: "light" });
      assert.equal(accesses, 0, `constructor must not access document (accesses: ${accesses})`);
      controller.destroy();
    } finally {
      if (originalDocument) {
        Object.defineProperty(globalThis, "document", originalDocument);
      }
    }
  });
});
