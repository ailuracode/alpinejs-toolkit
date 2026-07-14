/**
 * Vitest setup for `@ailuracode/alpine-sidebar`.
 *
 * Installs a controllable `matchMedia` polyfill on `window` so the
 * breakpoint observer can be exercised deterministically. jsdom does NOT
 * ship `matchMedia`; the package must work under both the real API and
 * the test stub.
 *
 * The stub is mounted on `window.matchMedia` (NOT `globalThis.matchMedia`)
 * because `@ailuracode/alpine-core`'s `safeMatchMedia` — which the
 * breakpoint observer uses — reads the API from `window.matchMedia` per
 * the SSR contract documented in core's source.
 *
 * Resets `documentElement` attributes between tests so persisted
 * `data-sidebar` markers from a previous case do not leak.
 *
 * Per `.cursor/rules/tooling-configs.mdc`, `setupFiles` MUST
 * point to `test/setup.ts` when global stubs are needed.
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

/** Re-applies the controllable `matchMedia` stub on `window`. */
export function installMatchMediaMock(): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMediaMock,
  });
}

// Save the original `window.matchMedia` so we can restore it during
// `afterAll`. The core spec does the same dance — see
// `packages/core/test/match-media.spec.ts`.
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
installMatchMediaMock();

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
  // Reset documentElement classes / attributes between tests so the
  // previous case's `data-sidebar` markers do not bleed into the next.
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-sidebar");
});

afterEach(() => {
  // Reset the singleton registry so each test gets a fresh
  // `createSidebar()` instance. Tests that don't call `destroy()`
  // (or that throw before reaching it) would otherwise leak the
  // previous controller into the next case.
  clearAllSingletons();
});

afterAll(() => {
  // Restore the original `window.matchMedia` so we don't leak the stub
  // into other test files that share the same jsdom worker.
  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", originalMatchMedia);
  } else {
    (window as { matchMedia?: unknown }).matchMedia = undefined;
  }
});
