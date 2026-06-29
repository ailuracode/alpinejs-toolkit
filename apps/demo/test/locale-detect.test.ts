import { describe, expect, it } from "vitest";
import {
  isPlaygroundPath,
  localeFromPathname,
  localizedPath,
  localizedPlaygroundRedirectTarget,
  preferredBrowserLocale,
  shouldSkipLocaleDetect,
} from "../src/locale-detect";

describe("locale-detect", () => {
  it("maps pathname prefixes to locales", () => {
    expect(localeFromPathname("/")).toBe("en");
    expect(localeFromPathname("/getting-started/")).toBe("en");
    expect(localeFromPathname("/es/")).toBe("es");
    expect(localeFromPathname("/es/getting-started/")).toBe("es");
    expect(localeFromPathname("/pt/plugins/theme/")).toBe("pt");
  });

  it("skips playground and static assets", () => {
    expect(shouldSkipLocaleDetect("/playground/")).toBe(true);
    expect(shouldSkipLocaleDetect("/playground/theme/")).toBe(true);
    expect(shouldSkipLocaleDetect("/es/playground/")).toBe(true);
    expect(shouldSkipLocaleDetect("/es/playground/child/")).toBe(true);
    expect(shouldSkipLocaleDetect("/pt/playground/")).toBe(true);
    expect(isPlaygroundPath("/es/playground/child/")).toBe(true);
    expect(shouldSkipLocaleDetect("/_astro/page.js")).toBe(true);
    expect(shouldSkipLocaleDetect("/favicon.ico")).toBe(true);
    expect(shouldSkipLocaleDetect("/getting-started/")).toBe(false);
  });

  it("prefers es and pt from Accept-Language-style lists", () => {
    expect(preferredBrowserLocale(["es-ES", "en"])).toBe("es");
    expect(preferredBrowserLocale(["pt-BR"])).toBe("pt");
    expect(preferredBrowserLocale(["en-US", "de"])).toBe("en");
  });

  it("builds localized paths", () => {
    expect(localizedPath("/", "es")).toBe("/es/");
    expect(localizedPath("/query/", "pt")).toBe("/pt/query/");
  });

  it("maps localized playground paths to locale-neutral routes", () => {
    expect(localizedPlaygroundRedirectTarget("/es/playground")).toBe("/playground/");
    expect(localizedPlaygroundRedirectTarget("/es/playground/")).toBe("/playground/");
    expect(localizedPlaygroundRedirectTarget("/es/playground/child/")).toBe("/playground/child/");
    expect(localizedPlaygroundRedirectTarget("/pt/playground/theme/")).toBe("/playground/theme/");
    expect(localizedPlaygroundRedirectTarget("/playground/")).toBeNull();
  });
});
