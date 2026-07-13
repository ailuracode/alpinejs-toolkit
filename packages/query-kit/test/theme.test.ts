import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyDevtoolsThemeClass,
  bindDevtoolsTheme,
  resolveDevtoolsTheme,
  resolveHostTheme,
} from "../src/devtools/theme.js";

describe("query devtools theme", () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = "";
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    document.documentElement.dataset.theme = "";
    document.documentElement.classList.remove("dark");
  });

  it("resolveHostTheme() reads data-theme on the document root", () => {
    document.documentElement.dataset.theme = "dark";
    expect(resolveHostTheme()).toBe("dark");

    document.documentElement.dataset.theme = "light";
    expect(resolveHostTheme()).toBe("light");
  });

  it("resolveHostTheme() falls back to .dark on the document root", () => {
    document.documentElement.classList.add("dark");
    expect(resolveHostTheme()).toBe("dark");
  });

  it("resolveHostTheme() falls back to prefers-color-scheme when no data-theme or .dark", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as MediaQueryList);

    expect(resolveHostTheme()).toBe("dark");
  });

  it("resolveHostTheme() returns light when prefers-color-scheme does not match", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    } as MediaQueryList);

    expect(resolveHostTheme()).toBe("light");
  });

  it("resolveDevtoolsTheme() honors forced theme options", () => {
    document.documentElement.dataset.theme = "dark";
    expect(resolveDevtoolsTheme("light")).toBe("light");
    expect(resolveDevtoolsTheme("dark")).toBe("dark");
    expect(resolveDevtoolsTheme("system")).toBe("dark");
  });

  it("applyDevtoolsThemeClass() sets the resolved theme class", () => {
    const root = document.createElement("div");
    document.documentElement.dataset.theme = "dark";

    applyDevtoolsThemeClass(root, "system");
    expect(root.classList.contains("aq-devtools-root--dark")).toBe(true);
    expect(root.classList.contains("aq-devtools-root--light")).toBe(false);

    applyDevtoolsThemeClass(root, "light");
    expect(root.classList.contains("aq-devtools-root--light")).toBe(true);
    expect(root.classList.contains("aq-devtools-root--dark")).toBe(false);
  });

  it("bindDevtoolsTheme() reacts to host theme changes in system mode", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    document.documentElement.dataset.theme = "light";

    const unbind = bindDevtoolsTheme(root, "system");
    expect(root.classList.contains("aq-devtools-root--light")).toBe(true);

    document.documentElement.dataset.theme = "dark";
    await vi.waitFor(() => {
      expect(root.classList.contains("aq-devtools-root--dark")).toBe(true);
    });

    unbind();
    root.remove();
  });
});
