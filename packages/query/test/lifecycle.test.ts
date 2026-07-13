import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vanillaQueryAdapter } from "../src/adapters/vanilla.js";
import { QueryCache } from "../src/cache.js";
import { createQueryClient } from "../src/client.js";

type ListenerMap = Map<string, Set<EventListenerOrEventListenerObject>>;

function createListenerTracker(): {
  add: (type: string, listener: EventListenerOrEventListenerObject) => void;
  remove: (type: string, listener: EventListenerOrEventListenerObject) => void;
  count: (type: string) => number;
} {
  const listeners: ListenerMap = new Map();

  const add = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    const bucket = listeners.get(type) ?? new Set<EventListenerOrEventListenerObject>();
    bucket.add(listener);
    listeners.set(type, bucket);
  });

  const remove = vi.fn((type: string, listener: EventListenerOrEventListenerObject) => {
    listeners.get(type)?.delete(listener);
  });

  return {
    add,
    remove,
    count: (type: string) => listeners.get(type)?.size ?? 0,
  };
}

function createCache() {
  return new QueryCache({
    adapter: vanillaQueryAdapter,
    defaultQueryOptions: {},
    defaultMutationRetry: 0,
    defaultMutationRetryDelay: 1000,
  });
}

describe("@ailuracode/alpine-query lifecycle", () => {
  let windowTracker: ReturnType<typeof createListenerTracker>;
  let documentTracker: ReturnType<typeof createListenerTracker>;

  beforeEach(() => {
    windowTracker = createListenerTracker();
    documentTracker = createListenerTracker();

    vi.stubGlobal("window", {
      addEventListener: windowTracker.add,
      removeEventListener: windowTracker.remove,
    });

    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: documentTracker.add,
      removeEventListener: documentTracker.remove,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches focus and visibility listeners when the first observer subscribes", () => {
    const cache = createCache();
    const query = cache.observe(["todos"], vi.fn().mockResolvedValue([]));

    expect(windowTracker.add).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(documentTracker.add).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(windowTracker.count("focus")).toBe(1);
    expect(documentTracker.count("visibilitychange")).toBe(1);

    query.destroy();
    cache.destroy();
  });

  it("removes global listeners when the last observer is destroyed", () => {
    const cache = createCache();
    const query = cache.observe(["todos"], vi.fn().mockResolvedValue([]));

    query.destroy();

    expect(windowTracker.remove).toHaveBeenCalledWith("focus", expect.any(Function));
    expect(documentTracker.remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(windowTracker.count("focus")).toBe(0);
    expect(documentTracker.count("visibilitychange")).toBe(0);
  });

  it("removes global listeners after reset() clears active observers", () => {
    const cache = createCache();
    cache.observe(["todos"], vi.fn().mockResolvedValue([]));

    cache.reset();

    expect(windowTracker.count("focus")).toBe(0);
    expect(documentTracker.count("visibilitychange")).toBe(0);
  });

  it("destroy() tears down listeners, entries, and devtools subscriptions", () => {
    const cache = createCache();
    const query = cache.observe(["todos"], vi.fn().mockResolvedValue([]));
    const listener = vi.fn();
    const unsubscribe = cache.getDevtools().subscribe(listener);

    cache.destroy();

    expect(windowTracker.count("focus")).toBe(0);
    expect(documentTracker.count("visibilitychange")).toBe(0);
    expect(cache.getEntries()).toEqual([]);
    expect(cache.isDestroyed).toBe(true);

    listener.mockClear();
    unsubscribe();
    cache.getDevtools().clearMutations();
    expect(listener).not.toHaveBeenCalled();

    query.destroy();
  });

  it("destroy() is idempotent", () => {
    const cache = createCache();
    cache.observe(["todos"], vi.fn().mockResolvedValue([]));

    cache.destroy();
    cache.destroy();

    expect(windowTracker.remove).toHaveBeenCalledTimes(1);
    expect(documentTracker.remove).toHaveBeenCalledTimes(1);
  });

  it("rejects cache mutations after destroy()", () => {
    const cache = createCache();
    cache.destroy();

    expect(() => cache.observe(["todos"], vi.fn())).toThrow("QueryCache destroyed");
    expect(() => cache.fetch(["todos"], vi.fn())).toThrow("QueryCache destroyed");
    expect(() => cache.reset()).not.toThrow();
  });

  it("does not reattach listeners after destroy() even if observe() were allowed", () => {
    const cache = createCache();
    cache.observe(["todos"], vi.fn().mockResolvedValue([]));
    cache.destroy();

    expect(() => cache.observe(["todos"], vi.fn())).toThrow("QueryCache destroyed");
    expect(windowTracker.add).toHaveBeenCalledTimes(1);
  });

  it("multiple clients keep independent global listeners", () => {
    const first = createCache();
    const second = createCache();

    const firstQuery = first.observe(["first"], vi.fn().mockResolvedValue("a"));
    const secondQuery = second.observe(["second"], vi.fn().mockResolvedValue("b"));

    expect(windowTracker.count("focus")).toBe(2);
    expect(documentTracker.count("visibilitychange")).toBe(2);

    firstQuery.destroy();
    expect(windowTracker.count("focus")).toBe(1);
    expect(documentTracker.count("visibilitychange")).toBe(1);

    secondQuery.destroy();
    expect(windowTracker.count("focus")).toBe(0);
    expect(documentTracker.count("visibilitychange")).toBe(0);

    first.destroy();
    second.destroy();
  });

  it("supports HMR-like recreation without listener leaks", () => {
    let cache = createCache();
    const firstQuery = cache.observe(["todos"], vi.fn().mockResolvedValue([]));

    cache.destroy();
    firstQuery.destroy();

    cache = createCache();
    const secondQuery = cache.observe(["todos"], vi.fn().mockResolvedValue([]));

    expect(windowTracker.add).toHaveBeenCalledTimes(2);
    expect(windowTracker.remove).toHaveBeenCalledTimes(1);
    expect(windowTracker.count("focus")).toBe(1);

    secondQuery.destroy();
    cache.destroy();
  });

  it("createQueryClient().destroy() delegates to QueryCache", () => {
    const client = createQueryClient();
    client.observe(["todos"], vi.fn().mockResolvedValue([]));

    client.destroy();

    expect(windowTracker.count("focus")).toBe(0);
    expect(() => client.observe(["todos"], vi.fn())).toThrow("QueryCache destroyed");
  });
});
