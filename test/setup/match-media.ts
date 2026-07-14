import { vi } from "vitest";

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

export function resetMatchMedia(): void {
  queries.clear();
}

export interface WindowMatchMediaInstall {
  restore: () => void;
}

/**
 * Installs a controllable `matchMedia` stub on `window`.
 *
 * Package happy-dom projects use this because `@ailuracode/alpine-core`'s
 * `safeMatchMedia` reads `window.matchMedia` directly per the SSR contract.
 */
export function installWindowMatchMedia(): WindowMatchMediaInstall {
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMediaMock,
  });

  return {
    restore() {
      if (originalMatchMedia) {
        Object.defineProperty(window, "matchMedia", originalMatchMedia);
      } else {
        (window as { matchMedia?: unknown }).matchMedia = undefined;
      }
    },
  };
}

/** Re-applies the controllable `matchMedia` stub on `window`. */
export function installMatchMediaMock(): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMediaMock,
  });
}

/**
 * Installs the controllable stub on both `globalThis.matchMedia` and
 * `window.matchMedia`. Use in happy-dom tests that need deterministic media
 * queries (for example query-kit devtools responsive layout specs).
 */
export function installGlobalMatchMedia(): void {
  vi.stubGlobal("matchMedia", matchMediaMock);
  installMatchMediaMock();
}
