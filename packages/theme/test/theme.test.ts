import { beforeAll, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { setMatchMedia } from "../../../test/setup.js";
import themePlugin, { type ThemeMode, type ThemeStore } from "../src/index.js";

describe("@ailuracode/alpine-theme", () => {
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
});

describe("@ailuracode/alpine-theme system mode", () => {
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
    theme.refresh();

    expect(theme.resolved).toBe("light");
  });
});
