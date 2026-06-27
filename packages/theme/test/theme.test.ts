import { beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { setMatchMedia } from "../../../test/setup.js";
import themePlugin, {
  THEME_MODES,
  type ThemeMode,
  type ThemePluginOptions,
  type ThemeStore,
  type ThemeStoreOf,
} from "../src/index.js";

describe("@ailuracode/alpinejs-theme", () => {
  const onChange = vi.fn();
  let store: ThemeStore;

  beforeAll(() => {
    localStorage.setItem("test-theme", "light");
    const Alpine = startAlpine(themePlugin({ onChange, storageKey: "test-theme" }));
    store = Alpine.store("theme") as ThemeStore;
  });

  it("bootstraps from localStorage and notifies onChange", () => {
    expect(store.mode).toBe("light");
    expect(store.resolved).toBe("light");
    expect(store.isLight).toBe(true);
    expect(onChange).toHaveBeenCalledWith({
      mode: "light",
      resolved: "light",
    });
  });

  it("updates mode, persistence and onChange via set()", () => {
    onChange.mockClear();
    store.set("dark");

    expect(store.mode).toBe("dark");
    expect(store.isDark).toBe(true);
    expect(localStorage.getItem("test-theme")).toBe("dark");
    expect(onChange).toHaveBeenCalledWith({
      mode: "dark",
      resolved: "dark",
    });
  });

  it("cycles through modes", () => {
    store.set("light");
    store.cycle();
    expect(store.mode).toBe("dark");

    store.cycle();
    expect(store.mode).toBe("system");
  });

  it("exposes resolved getters", () => {
    store.set("dark");
    expect(store.isResolvedDark).toBe(true);
    expect(store.isResolved("dark")).toBe(true);
    expect(store.isResolvedLight).toBe(false);
  });

  it("ignores invalid or duplicate set calls", () => {
    store.set("dark");
    onChange.mockClear();

    store.set("invalid" as ThemeMode);
    expect(store.mode).toBe("dark");
    expect(onChange).not.toHaveBeenCalled();

    store.set("dark");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("returns false when resolved theme is unchanged", () => {
    store.set("light");
    expect(store.refresh()).toBe(false);
  });

  it("cycles through a custom mode order", () => {
    localStorage.setItem("custom-theme", "dark");
    const Alpine = startAlpine(
      themePlugin({ storageKey: "custom-theme", modes: ["dark", "light"] as const })
    );
    const custom = Alpine.store("theme") as ThemeStoreOf<["dark", "light"]>;

    expect(custom.mode).toBe("dark");
    custom.cycle();
    expect(custom.mode).toBe("light");
    custom.cycle();
    expect(custom.mode).toBe("dark");
  });
});

describe("@ailuracode/alpinejs-theme type inference", () => {
  it("infers default mode literals on the store", () => {
    localStorage.setItem("typed-theme", "light");
    const Alpine = startAlpine(themePlugin({ storageKey: "typed-theme" }));
    const store = Alpine.store("theme") as ThemeStore;

    expectTypeOf(store.mode).toEqualTypeOf<"light" | "dark" | "system">();
    expectTypeOf(store.resolved).toEqualTypeOf<"light" | "dark">();
    expectTypeOf(store.set).parameters.toEqualTypeOf<[mode: "light" | "dark" | "system"]>();
    expectTypeOf(store.is).parameters.toEqualTypeOf<[name: "light" | "dark" | "system"]>();
    expectTypeOf(THEME_MODES).toEqualTypeOf<readonly ["light", "dark", "system"]>();
  });

  it("infers onChange payload from custom modes", () => {
    type Options = ThemePluginOptions<["dark", "light"]>;
    type Payload = Parameters<NonNullable<Options["onChange"]>>[0];

    expectTypeOf<Payload["mode"]>().toEqualTypeOf<"dark" | "light">();
    expectTypeOf<Payload["resolved"]>().toEqualTypeOf<"light" | "dark">();
  });

  it("infers ThemeStoreOf from a custom modes tuple", () => {
    type CustomStore = ThemeStoreOf<["dark", "light"]>;
    expectTypeOf<CustomStore["mode"]>().toEqualTypeOf<"dark" | "light">();
  });
});

describe("@ailuracode/alpinejs-theme system mode", () => {
  it("resolves system preference from matchMedia", () => {
    localStorage.setItem("system-theme", "system");
    setMatchMedia("(prefers-color-scheme: dark)", true);

    const Alpine = startAlpine(themePlugin({ storageKey: "system-theme" }));
    const theme = Alpine.store("theme") as ThemeStore;

    expect(theme.mode).toBe("system");
    expect(theme.isSystem).toBe(true);
    expect(theme.resolved).toBe("dark");
    expect(theme.isResolvedDark).toBe(true);
  });

  it("falls back to system for invalid persisted values", () => {
    localStorage.setItem("invalid-theme", "neon");
    setMatchMedia("(prefers-color-scheme: dark)", false);

    const Alpine = startAlpine(themePlugin({ storageKey: "invalid-theme" }));
    const theme = Alpine.store("theme") as ThemeStore;

    expect(theme.mode).toBe("system");
    expect(theme.resolved).toBe("light");
    expect(theme.isResolvedLight).toBe(true);
  });

  it("refreshes when the OS theme changes in system mode", () => {
    localStorage.setItem("system-theme", "system");
    setMatchMedia("(prefers-color-scheme: dark)", true);

    const Alpine = startAlpine(themePlugin({ storageKey: "system-theme" }));
    const theme = Alpine.store("theme") as ThemeStore;

    setMatchMedia("(prefers-color-scheme: dark)", false);

    expect(theme.resolved).toBe("light");
  });
});
