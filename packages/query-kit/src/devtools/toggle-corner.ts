import { paintClasses } from "./ui-styles.js";

export const TOGGLE_CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

export type ToggleCorner = (typeof TOGGLE_CORNERS)[number];

export const DEFAULT_TOGGLE_CORNER: ToggleCorner = "bottom-right";
export const DEFAULT_TOGGLE_CORNER_STORAGE_KEY = "alpine-query-devtools:toggle-corner";

export function isToggleCorner(value: string | null): value is ToggleCorner {
  return value !== null && (TOGGLE_CORNERS as readonly string[]).includes(value);
}

export function loadToggleCorner(
  storageKey: string,
  fallback: ToggleCorner = DEFAULT_TOGGLE_CORNER
): ToggleCorner {
  if (typeof localStorage === "undefined") {
    return fallback;
  }

  try {
    const saved = localStorage.getItem(storageKey);
    return isToggleCorner(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

export function saveToggleCorner(storageKey: string, corner: ToggleCorner): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(storageKey, corner);
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function applyToggleCorner(element: HTMLElement, corner: ToggleCorner): void {
  paintClasses(element, "aq-devtools-toggle", `aq-devtools-toggle--${corner}`);
}

export function cornerLabel(corner: ToggleCorner): string {
  switch (corner) {
    case "top-left":
      return "Top left";
    case "top-right":
      return "Top right";
    case "bottom-left":
      return "Bottom left";
    default:
      return "Bottom right";
  }
}
