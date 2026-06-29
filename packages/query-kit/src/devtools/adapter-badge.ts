import { applyCssText } from "./style-utils.js";
import { paintClasses } from "./ui-styles.js";

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

/** Stable hue (0–359) derived from an adapter display name. */
export function adapterBadgeHue(name: string): number {
  return Math.floor((hashString(name) * 137.508) % 360);
}

export type AdapterBadgeTheme = "light" | "dark";

/** Inline badge colors derived from the adapter name (stable per label). */
export function adapterBadgeStyle(
  name: string,
  theme: AdapterBadgeTheme = "light"
): Record<string, string> {
  const hue = adapterBadgeHue(name);

  if (theme === "dark") {
    return {
      borderColor: `hsl(${hue}, 38%, 48%)`,
      background: `hsl(${hue}, 32%, 24%)`,
      color: `hsl(${hue}, 60%, 78%)`,
    };
  }

  return {
    borderColor: `hsl(${hue}, 48%, 68%)`,
    background: `hsl(${hue}, 42%, 90%)`,
    color: `hsl(${hue}, 55%, 28%)`,
  };
}

export function createAdapterBadge(
  name: string,
  theme: AdapterBadgeTheme = "light"
): HTMLSpanElement {
  const badge = document.createElement("span");
  const colors = adapterBadgeStyle(name, theme);

  paintClasses(badge, "aq-devtools-badge--shell", "aq-devtools-badge--adapter");
  applyCssText(
    badge,
    `${badge.style.cssText}; border-color: ${colors.borderColor}; background: ${colors.background}; color: ${colors.color}`
  );
  badge.className = "aq-devtools-badge aq-devtools-badge--adapter";
  badge.textContent = name;
  badge.title = name;

  return badge;
}
