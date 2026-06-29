import { describe, expect, it } from "vitest";
import {
  adapterBadgeHue,
  adapterBadgeStyle,
  createAdapterBadge,
} from "../src/devtools/adapter-badge.js";

describe("adapter-badge", () => {
  it("derives a stable hue from the adapter name", () => {
    expect(adapterBadgeHue("Nanostores")).toBe(adapterBadgeHue("Nanostores"));
    expect(adapterBadgeHue("Nanostores")).not.toBe(adapterBadgeHue("Alpine.reactive"));
  });

  it("builds light and dark palettes from the adapter name", () => {
    const light = adapterBadgeStyle("Alpine.reactive", "light");
    const dark = adapterBadgeStyle("Alpine.reactive", "dark");

    expect(light.background).toContain("hsl(");
    expect(light.color).toContain("28%)");
    expect(dark.background).toContain("hsl(");
    expect(dark.color).toContain("78%)");
    expect(light.background).not.toBe(dark.background);
  });

  it("renders an adapter badge with theme-specific inline colors", () => {
    const lightBadge = createAdapterBadge("Zustand", "light");
    const darkBadge = createAdapterBadge("Zustand", "dark");

    expect(lightBadge.textContent).toBe("Zustand");
    expect(lightBadge.className).toContain("aq-devtools-badge--adapter");
    expect(lightBadge.style.background).toContain("hsl(");
    expect(darkBadge.style.background).not.toBe(lightBadge.style.background);
  });
});
