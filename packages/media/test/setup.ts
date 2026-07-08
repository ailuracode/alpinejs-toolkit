/**
 * Vitest setup for `@ailuracode/alpine-media`.
 *
 * Installs a controllable `matchMedia` polyfill on `window` so the
 * controller can be exercised deterministically. The root-level
 * `test/setup.ts` already stubs `globalThis.matchMedia`, but the
 * controller reads through `safeMatchMedia` from
 * `@ailuracode/alpine-core`, which resolves `window.matchMedia`
 * directly per the SSR contract documented in core's source. The
 * per-package setup guarantees the right surface is wired when the
 * package is exercised in isolation (`pnpm --filter ...`).
 *
 * Resets `localStorage` between tests so persisted values from
 * other packages in the workspace do not leak into media tests
 * (media itself does not persist, but the cleanup mirrors the
 * convention used by `@ailuracode/alpine-theme`).
 */

import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterAll, afterEach, beforeEach, vi } from "vitest";

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener(_event: "change", listener: () => void): void;
  removeEventListener(_event: "change", listener: () => void): void;
  addListener(listener: () => void): void;
  removeListener(listener: () => void): void;
  dispatchEvent(_event: Event): boolean;
  onchange: null;
}

interface MockMediaQueryListInternal extends MockMediaQueryList {
  __listeners: Set<(event: MediaQueryListEvent) => void>;
  __fire(): void;
}

const queries = new Map<string, MockMediaQueryListInternal>();

function createList(query: string, initial = false): MockMediaQueryListInternal {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const list: MockMediaQueryListInternal = {
    matches: initial,
    media: query,
    onchange: null,
    addEventListener(_event, listener) {
      listeners.add(listener);
    },
    removeEventListener(_event, listener) {
      listeners.delete(listener);
    },
    addListener(listener) {
      listeners.add(listener);
    },
    removeListener(listener) {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
    __listeners: listeners,
    __fire() {
      const event = { matches: list.matches, media: list.media } as MediaQueryListEvent;
      for (const listener of listeners) {
        listener(event);
      }
    },
  };
  return list;
}

const matchMediaMock = vi.fn((query: string): MockMediaQueryList => {
  let entry = queries.get(query);
  if (!entry) {
    entry = createList(query);
    queries.set(query, entry);
  }
  return entry;
});

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: matchMediaMock,
});

/** Sets the current `matches` value of a query and fires its listeners. */
export function setMatchMedia(query: string, matches: boolean): void {
  let entry = queries.get(query);
  if (!entry) {
    entry = createList(query, matches);
    queries.set(query, entry);
    return;
  }
  entry.matches = matches;
  entry.__fire();
}

/** Returns the current `matches` value of a query (creating it as `false`). */
export function getMatchMedia(query: string): boolean {
  const entry = queries.get(query) ?? createList(query, false);
  queries.set(query, entry);
  return entry.matches;
}

beforeEach(() => {
  queries.clear();
  localStorage.clear();
});

afterAll(() => {
  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", originalMatchMedia);
  } else {
    (window as { matchMedia?: unknown }).matchMedia = undefined;
  }
});

// Reset the controller's singleton slot between tests so each case
// builds a fresh `MediaController`. `controller.destroy()` already
// calls `clearSingleton(MEDIA_SINGLETON_KEY)`, but a test that
// forgets to destroy would leak state into the next one — the
// `afterEach` hook makes the test suite independent of cleanup
// order.
afterEach(() => {
  clearAllSingletons();
});
