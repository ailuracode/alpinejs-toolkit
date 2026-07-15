/**
 * Tests for `@ailuracode/alpine-ui` media-query listener.
 *
 * Verifies the SSR-safe contract:
 * - Listener is invoked with the raw `MediaQueryListEvent` on every
 *   match flip.
 * - `Unsubscribe` is idempotent — calling it twice does not throw
 *   and the listener is detached after the first call.
 * - The factory returns a no-op `Unsubscribe` under SSR (no
 *   `window.matchMedia`).
 *
 * The matchMedia stub is set up in `beforeEach` so each test owns
 * its lifecycle (no cross-test contamination).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMediaQueryListener } from "../src/index";

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener(_event: string, listener: (event: { matches: boolean }) => void): void;
  removeEventListener(_event: string, listener: (event: { matches: boolean }) => void): void;
  dispatch(matches: boolean): void;
}

function createMockMediaQueryList(media: string, matches = false): MockMediaQueryList {
  const listeners = new Set<(event: { matches: boolean }) => void>();
  return {
    matches,
    media,
    addEventListener(_event, listener) {
      listeners.add(listener);
    },
    removeEventListener(_event, listener) {
      listeners.delete(listener);
    },
    dispatch(next) {
      this.matches = next;
      for (const listener of listeners) {
        listener({ matches: next });
      }
    },
  };
}

const mediaQueries = new Map<string, MockMediaQueryList>();

beforeEach(() => {
  mediaQueries.clear();
  vi.stubGlobal("window", {
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => true,
    matchMedia: vi.fn((query: string) => {
      if (!mediaQueries.has(query)) {
        mediaQueries.set(query, createMockMediaQueryList(query));
      }
      return mediaQueries.get(query);
    }),
  });
  vi.stubGlobal("document", {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  mediaQueries.clear();
});

function setMatchMedia(query: string, matches: boolean): void {
  if (!mediaQueries.has(query)) {
    mediaQueries.set(query, createMockMediaQueryList(query, matches));
    return;
  }
  mediaQueries.get(query)?.dispatch(matches);
}

describe("createMediaQueryListener", () => {
  it("invokes the listener with the raw event when the match flips", () => {
    const mql = createMockMediaQueryList("(min-width: 1024px)");
    mediaQueries.set("(min-width: 1024px)", mql);
    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 1024px)", listener);

    mql.dispatch(true);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ matches: true });

    unsubscribe();
  });

  it("invokes the listener on every match flip until unsubscribe", () => {
    const mql = createMockMediaQueryList("(min-width: 1024px)");
    mediaQueries.set("(min-width: 1024px)", mql);
    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 1024px)", listener);

    mql.dispatch(true);
    mql.dispatch(false);
    mql.dispatch(true);

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ matches: true });
    expect(listener.mock.calls[1]?.[0]).toMatchObject({ matches: false });
    expect(listener.mock.calls[2]?.[0]).toMatchObject({ matches: true });

    unsubscribe();
  });

  it("stops invoking the listener after unsubscribe", () => {
    const mql = createMockMediaQueryList("(min-width: 1024px)");
    mediaQueries.set("(min-width: 1024px)", mql);
    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 1024px)", listener);

    mql.dispatch(true);
    unsubscribe();
    mql.dispatch(false);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("unsubscribe is idempotent — calling it twice does not throw", () => {
    const mql = createMockMediaQueryList("(min-width: 1024px)");
    mediaQueries.set("(min-width: 1024px)", mql);
    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 1024px)", listener);

    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it("returns a no-op unsubscribe when matchMedia is unavailable", () => {
    vi.stubGlobal("window", {
      matchMedia: undefined,
    });
    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 1024px)", listener);
    expect(typeof unsubscribe).toBe("function");
    expect(() => unsubscribe()).not.toThrow();
    expect(listener).not.toHaveBeenCalled();
  });

  it("multiple listeners on the same query each receive the event", () => {
    const mql = createMockMediaQueryList("(min-width: 1024px)");
    mediaQueries.set("(min-width: 1024px)", mql);
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = createMediaQueryListener("(min-width: 1024px)", a);
    const unsubB = createMediaQueryListener("(min-width: 1024px)", b);

    mql.dispatch(true);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);

    unsubA();
    mql.dispatch(false);

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    expect(b.mock.calls[1]?.[0]).toMatchObject({ matches: false });

    unsubB();
  });

  it("ignores events fired after the listener was torn down (active flag)", () => {
    const mql = createMockMediaQueryList("(min-width: 1024px)");
    mediaQueries.set("(min-width: 1024px)", mql);
    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 1024px)", listener);

    mql.dispatch(true);
    unsubscribe();
    mql.dispatch(false);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("uses the test setup helper for SSR-style isolation", () => {
    setMatchMedia("(min-width: 768px)", false);
    const mql = mediaQueries.get("(min-width: 768px)");
    expect(mql?.matches).toBe(false);

    const listener = vi.fn();
    const unsubscribe = createMediaQueryListener("(min-width: 768px)", listener);

    setMatchMedia("(min-width: 768px)", true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatchObject({ matches: true });

    unsubscribe();
  });
});
