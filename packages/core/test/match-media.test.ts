import { afterEach, describe, expect, it, vi } from "vitest";
import { setMatchMedia } from "../../../test/setup.js";
import {
  createMatchMediaWatcher,
  readTouchCapabilities,
  safeMatchMedia,
  watchMatchMedia,
} from "../src/index.js";

describe("@ailuracode/alpine-core match-media", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("safeMatchMedia returns a MediaQueryList in browser", () => {
    setMatchMedia("(pointer: fine)", true);
    expect(safeMatchMedia("(pointer: fine)")?.matches).toBe(true);
  });

  it("createMatchMediaWatcher invokes callback on change", () => {
    setMatchMedia("(hover: hover)", false);
    const callback = vi.fn();

    createMatchMediaWatcher("(hover: hover)", callback);
    setMatchMedia("(hover: hover)", true);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("createMatchMediaWatcher unsubscribes", () => {
    setMatchMedia("(hover: hover)", false);
    const callback = vi.fn();

    const unsubscribe = createMatchMediaWatcher("(hover: hover)", callback);
    unsubscribe();
    setMatchMedia("(hover: hover)", true);

    expect(callback).not.toHaveBeenCalled();
  });

  it("watchMatchMedia listens to multiple queries", () => {
    setMatchMedia("(pointer: coarse)", false);
    setMatchMedia("(pointer: fine)", true);
    const callback = vi.fn();

    watchMatchMedia(["(pointer: coarse)", "(pointer: fine)"], callback);
    setMatchMedia("(pointer: coarse)", true);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("@ailuracode/alpine-core touch-capabilities", () => {
  it("readTouchCapabilities detects coarse pointer", () => {
    setMatchMedia("(pointer: coarse)", true);
    setMatchMedia("(pointer: fine)", false);
    setMatchMedia("(hover: hover)", false);

    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 2,
    });

    expect(readTouchCapabilities()).toEqual({
      maxTouchPoints: 2,
      isTouch: true,
      isCoarse: true,
      isFine: false,
      canHover: false,
    });
  });

  it("readTouchCapabilities detects ontouchstart fallback", () => {
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

    expect(readTouchCapabilities().isTouch).toBe(true);
  });
});
