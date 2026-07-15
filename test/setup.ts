import { clearAllSingletons, resetRegistrationTracking } from "@ailuracode/alpine-core";
import { afterEach, beforeEach, vi } from "vitest";

const mediaListeners = new Map<string, Set<() => void>>();

interface MockMediaQueryList {
  media: string;
  matches: boolean;
  addEventListener(_event: string, listener: () => void): void;
  removeEventListener(_event: string, listener: () => void): void;
  addListener(listener: () => void): void;
  removeListener(listener: () => void): void;
  dispatch(matches: boolean): void;
}

function createMediaQueryList(query: string, matches = false): MockMediaQueryList {
  const listeners = new Set<() => void>();

  return {
    media: query,
    matches,
    addEventListener(_event, listener) {
      listeners.add(listener);
      mediaListeners.set(query, listeners);
    },
    removeEventListener(_event, listener) {
      listeners.delete(listener);
    },
    addListener(listener) {
      listeners.add(listener);
      mediaListeners.set(query, listeners);
    },
    removeListener(listener) {
      listeners.delete(listener);
    },
    dispatch(matches) {
      this.matches = matches;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

const mediaQueries = new Map<string, MockMediaQueryList>();

vi.stubGlobal(
  "matchMedia",
  vi.fn((query: string) => {
    if (!mediaQueries.has(query)) {
      mediaQueries.set(query, createMediaQueryList(query));
    }
    return mediaQueries.get(query);
  })
);

export function setMatchMedia(query: string, matches: boolean): void {
  if (!mediaQueries.has(query)) {
    mediaQueries.set(query, createMediaQueryList(query, matches));
    return;
  }

  mediaQueries.get(query)?.dispatch(matches);
}

export function resetMatchMedia(): void {
  mediaQueries.clear();
  mediaListeners.clear();
}

class MockIntersectionObserver {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
}

class MockResizeObserver {
  observe(): void {
    /* noop */
  }
  unobserve(): void {
    /* noop */
  }
  disconnect(): void {
    /* noop */
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

if (typeof globalThis.ResizeObserver === "undefined") {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
}

beforeEach(() => {
  localStorage.clear();
  resetMatchMedia();
  document.documentElement.innerHTML = "<head></head><body></body>";
  document.body.innerHTML = "";
  document.body.removeAttribute("style");
  document.body.className = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";
  // The `media` package tests poke at `window.ontouchstart` to verify the
  // touch heuristic. Other tests must not leak that property into them.
  Object.defineProperty(window, "ontouchstart", { configurable: true, value: undefined });
  Reflect.deleteProperty(window, "ontouchstart");
});

afterEach(() => {
  // Package-level setup files are not loaded when Vitest runs from the
  // workspace root. Reset singleton registries here so store/factory
  // plugins (theme, sidebar, scroll, lang, …) do not leak controllers
  // — and their options fingerprints — into the next test case.
  clearAllSingletons();
  // Reset the Alpine registration-guard tracking sets so a magic or
  // directive registered in one test does not collide with the next
  // test that mounts a fresh Alpine runtime. Production code cleans
  // its own tracking through `bridgeControllerStore`'s lifecycle;
  // tests need the same reset because each test owns a fresh Alpine
  // instance and the tracker is process-local.
  resetRegistrationTracking();
});

// Replace `globalThis.fetch` with a stub that rejects synchronously. This prevents
// happy-dom from registering in-flight fetch tasks when a test forgets to inject
// a custom `fetcher` — those tasks would otherwise be aborted during teardown and
// pollute the output with an `AbortError` from `AsyncTaskManager.abortAll()`.
// Tests that need real fetch behavior (e.g. typedFetch tests) inject their own
// `fetcher` mock per test.
if (typeof globalThis.fetch === "function") {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error(
        "globalThis.fetch is stubbed in tests. Pass a `fetcher` option to typedFetch/jsonApiClient/queryFn, or restore the original via `vi.unstubAllGlobals()`."
      );
    })
  );
}
