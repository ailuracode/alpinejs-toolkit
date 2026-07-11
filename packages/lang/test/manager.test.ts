import assert from "node:assert/strict";
import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLang, type LangChangeDetail, LangController } from "../src/index.js";

/**
 * Injectable navigator fixtures. Production code reads the global
 * `navigator`; tests inject via `createLang({ navigator })` to
 * avoid mutating globals between cases.
 */
const BROWSER_ES_EC = {
  language: "es-EC",
  languages: ["es-EC", "es", "en-US"],
} as const;

const BROWSER_PT_BR = {
  language: "pt-BR",
  languages: ["pt-BR", "pt"],
} as const;

const BROWSER_EMPTY = {
  language: "",
  languages: ["pt-BR", "pt"],
} as const;

const BROWSER_MISSING_PRIMARY = {
  languages: ["en", "fr"],
} as const;

describe("LangController detection", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("uses the injected navigator.language as the initial value", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.current).toBe("es-ec");
    expect(manager.base).toBe("es");
    expect(manager.region).toBe("ec");
    expect(manager.languages).toEqual(["es-ec", "es", "en-us"]);
    expect(manager.isDetected).toBe(true);
    expect(manager.fallback).toBe("en");
  });

  it("falls back to navigator.languages[0] when navigator.language is empty", () => {
    const manager = createLang({ navigator: BROWSER_EMPTY });

    expect(manager.current).toBe("pt-br");
    expect(manager.base).toBe("pt");
    expect(manager.region).toBe("br");
    expect(manager.languages).toEqual(["pt-br", "pt"]);
    expect(manager.isDetected).toBe(true);
  });

  it("falls back to navigator.languages[0] when navigator.language is missing", () => {
    const manager = createLang({ navigator: BROWSER_MISSING_PRIMARY });

    expect(manager.current).toBe("en");
    expect(manager.languages).toEqual(["en", "fr"]);
    expect(manager.isDetected).toBe(true);
  });

  it("uses the configured fallback when navigator is null", () => {
    const manager = createLang({ navigator: null, fallback: "fr" });

    expect(manager.current).toBe("fr");
    expect(manager.base).toBe("fr");
    expect(manager.region).toBeNull();
    expect(manager.languages).toEqual([]);
    expect(manager.isDetected).toBe(false);
    expect(manager.fallback).toBe("fr");
  });

  it("defaults the fallback to en", () => {
    const manager = createLang({ navigator: null });

    expect(manager.current).toBe("en");
    expect(manager.fallback).toBe("en");
  });

  it("extracts base and region from the detected language", () => {
    const manager = createLang({
      navigator: { language: "zh-Hant-TW", languages: ["zh-Hant-TW"] },
    });

    expect(manager.current).toBe("zh-hant-tw");
    expect(manager.base).toBe("zh");
    expect(manager.region).toBe("hant");
  });
});

describe("LangController.is()", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("matches the exact current tag and case-insensitively", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.is("es-ec")).toBe(true);
    expect(manager.is("ES-EC")).toBe(true);
  });

  it("matches the base subtag when no region is requested", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.is("es")).toBe(true);
    expect(manager.is("ES")).toBe(true);
  });

  it("returns false for unrelated tags", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.is("en")).toBe(false);
    expect(manager.is("en-us")).toBe(false);
    expect(manager.is("fr")).toBe(false);
  });
});

describe("LangController.includes()", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("matches a base tag present in navigator.languages", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.includes("es")).toBe(true);
    expect(manager.includes("en")).toBe(true);
  });

  it("does not match unrelated bases", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.includes("fr")).toBe(false);
    expect(manager.includes("de")).toBe(false);
  });

  it("matches an exact full tag", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    expect(manager.includes("en-US")).toBe(true);
  });

  it("returns false when the languages list is empty", () => {
    const manager = createLang({ navigator: null, fallback: "es" });

    expect(manager.languages).toEqual([]);
    expect(manager.includes("es")).toBe(false);
  });
});

describe("LangController.set()", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("updates current, base, region and emits the change event", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    manager.set("en");

    expect(manager.current).toBe("en");
    expect(manager.base).toBe("en");
    expect(manager.region).toBeNull();

    const detail = listener.mock.calls[0]?.[0] as LangChangeDetail;
    expect(detail.current).toBe("en");
    expect(detail.source).toBe("user");
    expect(detail.previous?.current).toBe("es-ec");
  });

  it("normalizes underscores and case", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    manager.set("EN_US");

    expect(manager.current).toBe("en-us");
    expect(manager.base).toBe("en");
    expect(manager.region).toBe("us");

    const detail = listener.mock.calls[0]?.[0] as LangChangeDetail;
    expect(detail.current).toBe("en-us");
  });

  it("does not emit when the value is unchanged", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    // Same as the detected primary, normalized ("es-EC" → "es-ec").
    manager.set("es-EC");

    expect(listener).not.toHaveBeenCalled();
    expect(manager.current).toBe("es-ec");
  });

  it("ignores empty values", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    manager.set("");

    expect(listener).not.toHaveBeenCalled();
    expect(manager.current).toBe("es-ec");
  });
});

describe("LangController.reset()", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("restores the values detected from the injected navigator", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    manager.set("fr");
    expect(manager.current).toBe("fr");

    manager.reset();

    expect(manager.current).toBe("es-ec");
    expect(manager.base).toBe("es");
    expect(manager.region).toBe("ec");
    expect(manager.languages).toEqual(["es-ec", "es", "en-us"]);
    expect(manager.isDetected).toBe(true);
  });

  it("emits a change event with source: 'reset' and the previous snapshot", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    manager.set("fr");

    const listener = vi.fn();
    manager.on("change", listener);
    manager.reset();

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0]?.[0] as LangChangeDetail;
    expect(detail.source).toBe("reset");
    expect(detail.previous?.current).toBe("fr");
    expect(detail.current).toBe("es-ec");
  });

  it("falls back to the configured fallback when navigator is null", () => {
    const manager = createLang({ navigator: null, fallback: "ja" });

    manager.set("en");
    expect(manager.current).toBe("en");

    manager.reset();

    expect(manager.current).toBe("ja");
    expect(manager.base).toBe("ja");
    expect(manager.region).toBeNull();
    expect(manager.isDetected).toBe(false);
  });
});

describe("LangController normalization", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("does not normalize when normalize: false", () => {
    const manager = createLang({
      navigator: { language: "EN-us", languages: ["EN-us"] },
      normalize: false,
    });

    expect(manager.current).toBe("EN-us");
    expect(manager.base).toBe("EN");
    expect(manager.region).toBe("us");
  });

  it("normalizes the fallback when enabled", () => {
    const manager = createLang({ navigator: null, fallback: "EN_US" });

    expect(manager.current).toBe("en-us");
    expect(manager.fallback).toBe("en-us");
  });

  it("keeps the casing of languages entries when normalize is disabled", () => {
    const manager = createLang({
      navigator: { language: "EN-us", languages: ["EN-us", "Fr"] },
      normalize: false,
    });

    expect([...manager.languages]).toEqual(["EN-us", "Fr"]);
  });
});

describe("LangController lifecycle", () => {
  afterEach(() => {
    clearAllSingletons();
  });

  it("is idempotent on destroy", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    manager.destroy();
    expect(() => manager.destroy()).not.toThrow();
    assert.equal(manager.isDestroyed, true);
  });

  it("stops emitting changes after destroy", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    manager.destroy();
    manager.set("en");

    expect(listener).not.toHaveBeenCalled();
  });

  it("direct construction with injected navigator seeds state before mount", () => {
    const manager = new LangController({
      navigator: BROWSER_ES_EC,
      id: "alpha",
    });

    expect(manager.isMounted).toBe(false);
    expect(manager.current).toBe("es-ec");
    expect(manager.isDetected).toBe(true);
  });

  it("direct construction without navigator seeds fallback until mount", () => {
    const manager = new LangController({ fallback: "fr", id: "beta" });

    expect(manager.isMounted).toBe(false);
    expect(manager.current).toBe("fr");
    expect(manager.isDetected).toBe(false);

    manager.mount();
    expect(manager.isMounted).toBe(true);
  });

  it("mount() is idempotent", async () => {
    const manager = new LangController({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    manager.mount();
    manager.mount();
    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("destroy() before mount() suppresses the initialization event", async () => {
    const manager = new LangController({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    manager.destroy();
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
    assert.equal(manager.isDestroyed, true);
    expect(() => manager.mount()).toThrow(/after destroy\(\)/);
  });

  it("emits an initialization event on mount with source: 'initialization'", async () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });
    const listener = vi.fn();
    manager.on("change", listener);

    await Promise.resolve();

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0]?.[0] as LangChangeDetail;
    expect(detail.source).toBe("initialization");
    expect(detail.previous).toBeNull();
    expect(detail.current).toBe("es-ec");
  });

  it("exposes a get() snapshot", () => {
    const manager = createLang({ navigator: BROWSER_ES_EC });

    const snapshot = manager.get();

    expect(snapshot.current).toBe("es-ec");
    expect(snapshot.base).toBe("es");
    expect(snapshot.region).toBe("ec");
    expect(snapshot.fallback).toBe("en");
    expect(snapshot.isDetected).toBe(true);
    expect([...snapshot.languages]).toEqual(["es-ec", "es", "en-us"]);
  });

  it("direct construction skips the singleton factory", () => {
    const a = new LangController({
      navigator: BROWSER_ES_EC,
      id: "alpha",
    });
    a.mount();
    const b = new LangController({
      navigator: BROWSER_PT_BR,
      id: "bravo",
    });
    b.mount();

    expect(a.current).toBe("es-ec");
    expect(b.current).toBe("pt-br");
    assert.equal(a.id, "alpha");
    assert.equal(b.id, "bravo");
  });
});

describe("createLang singleton lifecycle", () => {
  beforeEach(() => {
    clearAllSingletons();
  });

  afterEach(() => {
    clearAllSingletons();
  });

  it("returns the same instance on repeated factory calls", () => {
    const a = createLang({ navigator: BROWSER_ES_EC });
    const b = createLang({ navigator: BROWSER_PT_BR });

    expect(a).toBe(b);
    expect(a.current).toBe("es-ec");
  });

  it("builds a fresh instance after destroy", () => {
    const a = createLang({ navigator: BROWSER_ES_EC });
    a.destroy();
    const b = createLang({ navigator: BROWSER_PT_BR });

    expect(b).not.toBe(a);
    expect(b.current).toBe("pt-br");
  });
});

describe("LangController SSR fallback", () => {
  let originalNavigator: typeof globalThis.navigator;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
    clearAllSingletons();
  });

  it("uses the configured fallback when navigator is undefined", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: undefined,
    });
    const manager = createLang({ fallback: "es" });

    expect(manager.current).toBe("es");
    expect(manager.base).toBe("es");
    expect(manager.region).toBeNull();
    expect(manager.languages).toEqual([]);
    expect(manager.isDetected).toBe(false);
  });

  it("direct construction does not read the global navigator", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        language: "de-DE",
        languages: ["de-DE", "de"],
      },
    });

    const manager = new LangController({ fallback: "en", id: "ssr-direct" });

    expect(manager.current).toBe("en");
    expect(manager.isDetected).toBe(false);

    manager.mount();
    expect(manager.current).toBe("de-de");
    expect(manager.isDetected).toBe(true);
  });
});
