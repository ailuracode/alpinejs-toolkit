import assert from "node:assert/strict";
import { clearAllSingletons } from "@ailuracode/alpine-core";
import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { type LangStore, langPlugin } from "../src/index.js";

/**
 * Minimal Alpine stub for plugin-level registration tests. Avoids
 * booting the real runtime so we can assert registration semantics
 * (store + magic + cleanup presence/absence) without DOM
 * dependencies.
 */
interface MockAlpine {
  stores: Record<string, unknown>;
  magics: Record<string, () => unknown>;
  cleanups: Array<() => void>;
  plugin(cb: (Alpine: MockAlpine) => void): void;
  store(name: string, value: unknown): void;
  store(name: string): unknown;
  magic(name: string, factory: () => unknown): void;
  cleanup(cb: () => void): void;
}

function createMockAlpine(): MockAlpine {
  const alpine: MockAlpine = {
    stores: {},
    magics: {},
    cleanups: [],
    plugin(cb) {
      cb(alpine);
    },
    store(name, value?) {
      if (value === undefined) {
        return alpine.stores[name];
      }
      alpine.stores[name] = value;
      return undefined;
    },
    magic(name, factory) {
      alpine.magics[name] = factory;
    },
    cleanup(cb) {
      alpine.cleanups.push(cb);
    },
  };
  return alpine;
}

function stubNavigator(
  language: string | undefined,
  languages: readonly string[] | undefined
): void {
  const stub = {
    language,
    languages: languages === undefined ? undefined : [...languages],
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: stub,
  });
}

function restoreNavigator(): void {
  // Reset to happy-dom's default navigator by deleting the stub
  // and letting the env re-register on next access.
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: undefined,
  });
}

describe("langPlugin — registration", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("registers the lang store and the $lang magic", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);

    assert.ok(Alpine.stores.lang);
    assert.ok(Alpine.magics.lang);
  });

  it("registers an Alpine cleanup callback when Alpine.cleanup is available", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);

    assert.equal(Alpine.cleanups.length, 1);
  });

  it("does not crash when Alpine.cleanup is missing", () => {
    interface AlpineMock {
      plugin: (cb: (alpine: AlpineMock) => void) => void;
      store(name: string, value?: unknown): void;
      store(name: string): unknown;
      magic: (name: string, factory: () => unknown) => void;
    }
    const stores: Record<string, unknown> = {};
    const Alpine: AlpineMock = {
      plugin(cb) {
        cb(Alpine);
      },
      store(name, value?) {
        if (value === undefined) {
          return stores[name];
        }
        stores[name] = value;
        return undefined;
      },
      magic() {
        // intentional no-op — mimics older Alpine versions
      },
    };

    expect(() => langPlugin()(Alpine as never)).not.toThrow();
    assert.ok(stores.lang);
  });

  it("returns the same store instance through the $lang magic", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);

    const factory = Alpine.magics.lang;
    const a = factory();
    const b = factory();

    expect(a).toBe(b);
  });
});

describe("langPlugin — store surface", () => {
  beforeEach(() => {
    stubNavigator("en-US", ["en-US"]);
    clearAllSingletons();
  });

  afterEach(() => {
    clearAllSingletons();
    restoreNavigator();
  });

  it("seeds the store with the navigator-detected language", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);
    const store = Alpine.stores.lang as LangStore;

    expect(store.current).toBe("en-us");
    expect(store.base).toBe("en");
    expect(store.region).toBe("us");
    expect(store.languages).toEqual(["en-us"]);
    expect(store.isDetected).toBe(true);
    expect(store.fallback).toBe("en");
  });

  it("passes the configured fallback through to the manager", () => {
    stubNavigator(undefined, undefined);
    clearAllSingletons();

    const Alpine = createMockAlpine();
    langPlugin({ fallback: "pt" })(Alpine as never);
    const store = Alpine.stores.lang as LangStore;

    expect(store.current).toBe("pt");
    expect(store.fallback).toBe("pt");
  });

  it("forwards set() to the manager", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);
    const store = Alpine.stores.lang as LangStore;

    store.set("fr");

    expect(store.current).toBe("fr");
    expect(store.base).toBe("fr");
    expect(store.region).toBeNull();
  });

  it("forwards reset() to the manager", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);
    const store = Alpine.stores.lang as LangStore;

    store.set("fr");
    expect(store.current).toBe("fr");

    store.reset();
    expect(store.current).toBe("en-us");
  });

  it("forwards is() to the manager", () => {
    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);
    const store = Alpine.stores.lang as LangStore;

    expect(store.is("en-US")).toBe(true);
    expect(store.is("es")).toBe(false);
    store.set("es-EC");
    expect(store.is("es")).toBe(true);
  });

  it("forwards includes() to the manager", () => {
    stubNavigator("es-EC", ["es-EC", "es", "en-US"]);
    clearAllSingletons();

    const Alpine = createMockAlpine();
    langPlugin()(Alpine as never);
    const store = Alpine.stores.lang as LangStore;

    expect(store.includes("es")).toBe(true);
    expect(store.includes("fr")).toBe(false);
  });
});

describe("langPlugin — reactivity (real Alpine)", () => {
  beforeEach(() => {
    stubNavigator("en-US", ["en-US"]);
    clearAllSingletons();
  });

  afterEach(() => {
    clearAllSingletons();
    restoreNavigator();
  });

  it("updates Alpine bindings after set()", async () => {
    startAlpine(langPlugin());
    document.body.innerHTML = `
      <div x-data>
        <span id="lang-current" x-text="$store.lang.current"></span>
        <span id="lang-base" x-text="$store.lang.base"></span>
        <span id="lang-region" x-text="$store.lang.region ?? ''"></span>
      </div>
    `;
    Alpine.initTree(document.body);

    expect(document.getElementById("lang-current")?.textContent).toBe("en-us");
    expect(document.getElementById("lang-base")?.textContent).toBe("en");
    expect(document.getElementById("lang-region")?.textContent).toBe("us");

    const store = Alpine.store("lang") as LangStore;
    store.set("es-EC");

    await Promise.resolve();

    expect(document.getElementById("lang-current")?.textContent).toBe("es-ec");
    expect(document.getElementById("lang-base")?.textContent).toBe("es");
    expect(document.getElementById("lang-region")?.textContent).toBe("ec");
  });

  it("reactive store and $lang magic mirror each other", async () => {
    startAlpine(langPlugin());
    document.body.innerHTML = `
      <div x-data>
        <span id="lang-magic" x-text="$lang.current"></span>
        <span id="lang-store" x-text="$store.lang.current"></span>
      </div>
    `;
    Alpine.initTree(document.body);

    expect(document.getElementById("lang-magic")?.textContent).toBe(
      document.getElementById("lang-store")?.textContent
    );

    const store = Alpine.store("lang") as LangStore;
    store.set("fr-CA");

    await Promise.resolve();

    expect(document.getElementById("lang-magic")?.textContent).toBe("fr-ca");
    expect(document.getElementById("lang-store")?.textContent).toBe("fr-ca");
  });
});
