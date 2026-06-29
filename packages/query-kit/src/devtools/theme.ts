import { paintClasses } from "./ui-styles.js";

export type DevtoolsTheme = "light" | "dark" | "system";

const noop = (): void => undefined;

export function resolveHostTheme(root: HTMLElement = document.documentElement): "light" | "dark" {
  const dataTheme = root.dataset.theme;

  if (dataTheme === "light" || dataTheme === "dark") {
    return dataTheme;
  }

  if (root.classList.contains("dark")) {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveDevtoolsTheme(theme: DevtoolsTheme): "light" | "dark" {
  if (theme === "light" || theme === "dark") {
    return theme;
  }

  return resolveHostTheme();
}

export function applyDevtoolsThemeClass(element: HTMLElement, theme: DevtoolsTheme): void {
  const resolved = resolveDevtoolsTheme(theme);
  paintClasses(element, "aq-devtools-root", `aq-devtools-root--${resolved}`);
}

/** Apply theme classes and watch host changes when `theme` is `"system"`. */
export function bindDevtoolsTheme(
  element: HTMLElement,
  theme: DevtoolsTheme,
  onChange?: () => void
): () => void {
  const apply = (): void => {
    applyDevtoolsThemeClass(element, theme);
    onChange?.();
  };

  apply();

  if (theme !== "system") {
    return noop;
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "class"],
  });

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", apply);

  return () => {
    observer.disconnect();
    mediaQuery.removeEventListener("change", apply);
  };
}
