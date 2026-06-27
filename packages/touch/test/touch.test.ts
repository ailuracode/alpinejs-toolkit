import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import { setMatchMedia } from "../../../test/setup.js";
import touchPlugin, { type TouchMagic } from "../src/index.js";

describe("@ailuracode/alpinejs-touch", () => {
  it("registers $touch with pointer capabilities", () => {
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 2,
    });

    const { touch } = createMagicHarness(touchPlugin) as { touch: TouchMagic };

    expect(touch.isTouch).toBe(true);
    expect(touch.isCoarse).toBe(true);
    expect(touch.canHover).toBe(false);
    expect(touch.maxTouchPoints).toBe(2);
  });

  it("detects fine pointer devices", () => {
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", true);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });

    const { touch } = createMagicHarness(touchPlugin) as { touch: TouchMagic };

    expect(touch.isTouch).toBe(false);
    expect(touch.isFine).toBe(true);
    expect(touch.canHover).toBe(true);
  });

  it("detects touch support from touch events", () => {
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "ontouchstart", {
      configurable: true,
      value: null,
    });

    const { touch } = createMagicHarness(touchPlugin) as { touch: TouchMagic };

    expect(touch.isTouch).toBe(true);
  });

  it("updates state when pointer media queries change", () => {
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    setMatchMedia("(hover: hover)", false);

    const { touch } = createMagicHarness(touchPlugin) as { touch: TouchMagic };
    expect(touch.isCoarse).toBe(false);

    setMatchMedia("(pointer: coarse)", true);
    expect(touch.isCoarse).toBe(true);
    expect(touch.isTouch).toBe(true);
  });
});
