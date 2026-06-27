import Alpine from "alpinejs";
import { beforeAll, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import langPlugin, {
  type LangPluginOptions,
  type LangStore,
  normalizeLanguageTag,
  parseLanguageTag,
} from "../src/index.js";

function setNavigatorLanguage(value: string | null): void {
  if (value === null) {
    Object.defineProperty(navigator, "language", {
      configurable: true,
      value: undefined,
    });
  } else {
    Object.defineProperty(navigator, "language", {
      configurable: true,
      value,
    });
  }
}

function setNavigatorLanguages(values: string[] | undefined): void {
  if (values === undefined) {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: undefined,
    });
  } else {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: [...values],
    });
  }
}

describe("normalizeLanguageTag", () => {
  it("lowercases and replaces underscores with dashes", () => {
    expect(normalizeLanguageTag("ES-EC")).toBe("es-ec");
    expect(normalizeLanguageTag("en_US")).toBe("en-us");
    expect(normalizeLanguageTag("  Pt-BR ")).toBe("pt-br");
  });

  it("is idempotent", () => {
    expect(normalizeLanguageTag(normalizeLanguageTag("EN-us"))).toBe("en-us");
  });
});

describe("parseLanguageTag", () => {
  it("splits a region-tagged value without mutating case", () => {
    expect(parseLanguageTag("es-EC")).toEqual({ base: "es", region: "EC" });
    expect(parseLanguageTag("EN_us")).toEqual({ base: "EN", region: "us" });
  });

  it("returns null region when only a base is present", () => {
    expect(parseLanguageTag("EN")).toEqual({ base: "EN", region: null });
  });

  it("returns empty parts for an empty input", () => {
    expect(parseLanguageTag("")).toEqual({ base: "", region: null });
  });
});

describe("@ailuracode/alpine-lang detection", () => {
  beforeEach(() => {
    setNavigatorLanguage(null);
    setNavigatorLanguages(undefined);
  });

  it("detects the language from navigator.language", () => {
    setNavigatorLanguage("es-EC");
    setNavigatorLanguages(["es-EC", "es", "en-US"]);

    const Alpine = startAlpine(langPlugin());
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("es-ec");
    expect(store.base).toBe("es");
    expect(store.region).toBe("ec");
    expect(store.languages).toEqual(["es-ec", "es", "en-us"]);
    expect(store.isDetected).toBe(true);
    expect(store.fallback).toBe("en");
  });

  it("falls back to navigator.languages[0] when navigator.language is empty", () => {
    setNavigatorLanguage("");
    setNavigatorLanguages(["pt-BR", "pt", "en-US"]);

    const Alpine = startAlpine(langPlugin());
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("pt-br");
    expect(store.base).toBe("pt");
    expect(store.region).toBe("br");
    expect(store.languages).toEqual(["pt-br", "pt", "en-us"]);
    expect(store.isDetected).toBe(true);
  });

  it("uses the configured fallback when neither navigator.language nor navigator.languages is available", () => {
    setNavigatorLanguage(null);
    setNavigatorLanguages(undefined);

    const Alpine = startAlpine(langPlugin({ fallback: "fr" }));
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("fr");
    expect(store.base).toBe("fr");
    expect(store.region).toBeNull();
    expect(store.languages).toEqual([]);
    expect(store.isDetected).toBe(false);
    expect(store.fallback).toBe("fr");
  });

  it("defaults the fallback to en", () => {
    setNavigatorLanguage(null);
    setNavigatorLanguages(undefined);

    const Alpine = startAlpine(langPlugin());
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("en");
    expect(store.fallback).toBe("en");
  });
});

describe("@ailuracode/alpine-lang parsing", () => {
  beforeAll(() => {
    setNavigatorLanguage("zh-Hant-TW");
    setNavigatorLanguages(["zh-Hant-TW"]);
  });

  it("extracts base and region from the detected language", () => {
    const Alpine = startAlpine(langPlugin());
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("zh-hant-tw");
    expect(store.base).toBe("zh");
    expect(store.region).toBe("hant");
  });
});

describe("@ailuracode/alpine-lang is()", () => {
  let store: LangStore;

  beforeAll(() => {
    setNavigatorLanguage("es-EC");
    setNavigatorLanguages(["es-EC", "es", "en-US"]);
    const Alpine = startAlpine(langPlugin());
    store = Alpine.store("lang") as LangStore;
  });

  it("matches the exact current tag", () => {
    expect(store.is("es-ec")).toBe(true);
    expect(store.is("ES-EC")).toBe(true);
  });

  it("matches the base subtag when no region is requested", () => {
    expect(store.is("es")).toBe(true);
    expect(store.is("ES")).toBe(true);
  });

  it("returns false for unrelated tags", () => {
    expect(store.is("en")).toBe(false);
    expect(store.is("en-us")).toBe(false);
    expect(store.is("fr")).toBe(false);
  });
});

describe("@ailuracode/alpine-lang includes()", () => {
  let store: LangStore;

  beforeAll(() => {
    setNavigatorLanguage("es-EC");
    setNavigatorLanguages(["es-EC", "es", "en-US"]);
    const Alpine = startAlpine(langPlugin());
    store = Alpine.store("lang") as LangStore;
  });

  it("matches a base tag present in navigator.languages", () => {
    expect(store.includes("es")).toBe(true);
    expect(store.includes("en")).toBe(true);
  });

  it("does not match unrelated bases", () => {
    expect(store.includes("fr")).toBe(false);
    expect(store.includes("de")).toBe(false);
  });

  it("matches an exact full tag", () => {
    expect(store.includes("en-US")).toBe(true);
  });

  it("returns false when navigator.languages is empty", () => {
    setNavigatorLanguage(null);
    setNavigatorLanguages(undefined);
    const localAlpine = startAlpine(langPlugin({ fallback: "es" }));
    const isolated = localAlpine.store("lang") as LangStore;

    expect(isolated.languages).toEqual([]);
    expect(isolated.includes("es")).toBe(false);
    setNavigatorLanguage("es-EC");
    setNavigatorLanguages(["es-EC", "es", "en-US"]);
  });
});

describe("@ailuracode/alpine-lang set()", () => {
  let store: LangStore;
  const onChange = vi.fn();

  beforeAll(() => {
    setNavigatorLanguage("es-EC");
    setNavigatorLanguages(["es-EC", "es", "en-US"]);
    const Alpine = startAlpine(langPlugin({ onChange }));
    store = Alpine.store("lang") as LangStore;
  });

  it("updates current, base, region and notifies", () => {
    onChange.mockClear();
    store.set("en");

    expect(store.current).toBe("en");
    expect(store.base).toBe("en");
    expect(store.region).toBeNull();
    expect(onChange).toHaveBeenCalledWith("en");
  });

  it("normalizes underscores and case", () => {
    onChange.mockClear();
    store.set("EN_US");

    expect(store.current).toBe("en-us");
    expect(store.base).toBe("en");
    expect(store.region).toBe("us");
    expect(onChange).toHaveBeenCalledWith("en-us");
  });

  it("does not notify when the value is unchanged", () => {
    onChange.mockClear();
    store.set("en-us");

    expect(onChange).not.toHaveBeenCalled();
    expect(store.current).toBe("en-us");
  });

  it("ignores empty values", () => {
    onChange.mockClear();
    store.set("");

    expect(onChange).not.toHaveBeenCalled();
    expect(store.current).toBe("en-us");
  });
});

describe("@ailuracode/alpine-lang reset()", () => {
  it("restores the values detected from navigator", () => {
    setNavigatorLanguage("es-EC");
    setNavigatorLanguages(["es-EC", "es", "en-US"]);
    const onChange = vi.fn();
    const Alpine = startAlpine(langPlugin({ onChange }));
    const store = Alpine.store("lang") as LangStore;

    store.set("fr");
    expect(store.current).toBe("fr");
    expect(store.region).toBeNull();

    setNavigatorLanguage("pt-BR");
    setNavigatorLanguages(["pt-BR", "pt"]);

    onChange.mockClear();
    store.reset();

    expect(store.current).toBe("pt-br");
    expect(store.base).toBe("pt");
    expect(store.region).toBe("br");
    expect(store.languages).toEqual(["pt-br", "pt"]);
    expect(store.isDetected).toBe(true);
    expect(onChange).toHaveBeenCalledWith("pt-br");
  });

  it("falls back to the configured fallback when navigator is empty", () => {
    setNavigatorLanguage(null);
    setNavigatorLanguages(undefined);
    const Alpine = startAlpine(langPlugin({ fallback: "ja" }));
    const store = Alpine.store("lang") as LangStore;

    store.set("en");
    expect(store.current).toBe("en");

    store.reset();
    expect(store.current).toBe("ja");
    expect(store.base).toBe("ja");
    expect(store.region).toBeNull();
    expect(store.isDetected).toBe(false);
  });
});

describe("@ailuracode/alpine-lang reactivity", () => {
  it("updates Alpine bindings after set()", async () => {
    setNavigatorLanguage("en-US");
    setNavigatorLanguages(["en-US"]);

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
});

describe("@ailuracode/alpine-lang normalization", () => {
  it("does not normalize when normalize: false", () => {
    setNavigatorLanguage("EN-us");
    setNavigatorLanguages(["EN-us"]);

    const Alpine = startAlpine(langPlugin({ normalize: false }));
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("EN-us");
    expect(store.base).toBe("EN");
    expect(store.region).toBe("us");
  });

  it("normalizes the fallback when enabled", () => {
    setNavigatorLanguage(null);
    setNavigatorLanguages(undefined);

    const Alpine = startAlpine(langPlugin({ fallback: "EN_US" }));
    const store = Alpine.store("lang") as LangStore;

    expect(store.current).toBe("en-us");
    expect(store.fallback).toBe("en-us");
  });
});

describe("@ailuracode/alpine-lang SSR", () => {
  it("uses the fallback when navigator is undefined", () => {
    const originalNavigator = globalThis.navigator;
    // @ts-expect-error: simulate SSR by removing navigator
    globalThis.navigator = undefined;

    try {
      const Alpine = startAlpine(langPlugin({ fallback: "es" }));
      const store = Alpine.store("lang") as LangStore;

      expect(store.current).toBe("es");
      expect(store.base).toBe("es");
      expect(store.region).toBeNull();
      expect(store.languages).toEqual([]);
      expect(store.isDetected).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
    }
  });
});

describe("@ailuracode/alpine-lang type inference", () => {
  it("infers store fields and methods", () => {
    expectTypeOf<LangStore["current"]>().toEqualTypeOf<string>();
    expectTypeOf<LangStore["base"]>().toEqualTypeOf<string>();
    expectTypeOf<LangStore["region"]>().toEqualTypeOf<string | null>();
    expectTypeOf<LangStore["is"]>().parameters.toEqualTypeOf<[value: string]>();
    expectTypeOf<LangStore["includes"]>().parameters.toEqualTypeOf<[value: string]>();
    expectTypeOf<LangStore["set"]>().parameters.toEqualTypeOf<[language: string]>();
    expectTypeOf<LangStore["reset"]>().parameters.toEqualTypeOf<[]>();
  });

  it("infers plugin options", () => {
    expectTypeOf<LangPluginOptions["fallback"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<LangPluginOptions["normalize"]>().toEqualTypeOf<boolean | undefined>();
  });

  it("exposes normalizeLanguageTag / parseLanguageTag helpers", () => {
    expectTypeOf(normalizeLanguageTag).parameters.toEqualTypeOf<[value: string]>();
    expectTypeOf(normalizeLanguageTag).returns.toEqualTypeOf<string>();
    expectTypeOf(parseLanguageTag).parameters.toEqualTypeOf<[tag: string]>();
    expectTypeOf(parseLanguageTag).returns.toEqualTypeOf<{ base: string; region: string | null }>();
  });
});
