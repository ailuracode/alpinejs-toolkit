import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import visibilityPlugin, { readVisibilityState, type VisibilityMagic } from "../src/index.js";

function setDocumentVisibility(hidden: boolean, visibilityState: DocumentVisibilityState): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
}

describe("@ailuracode/alpine-visibility", () => {
  it("registers $visibility with initial visible state", () => {
    setDocumentVisibility(false, "visible");

    const { visibility } = createMagicHarness(visibilityPlugin) as { visibility: VisibilityMagic };

    expect(visibility.isVisible).toBe(true);
    expect(visibility.state).toBe("visible");
  });

  it("updates state on visibilitychange when tab is hidden", () => {
    setDocumentVisibility(false, "visible");

    const { visibility } = createMagicHarness(visibilityPlugin) as { visibility: VisibilityMagic };

    setDocumentVisibility(true, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(visibility.isVisible).toBe(false);
    expect(visibility.state).toBe("hidden");
  });

  it("updates state on visibilitychange when tab becomes visible", () => {
    setDocumentVisibility(true, "hidden");

    const { visibility } = createMagicHarness(visibilityPlugin) as { visibility: VisibilityMagic };
    expect(visibility.isVisible).toBe(false);

    setDocumentVisibility(false, "visible");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(visibility.isVisible).toBe(true);
    expect(visibility.state).toBe("visible");
  });
});

describe("readVisibilityState", () => {
  it("maps document.hidden and visibilityState", () => {
    expect(
      readVisibilityState({
        hidden: true,
        visibilityState: "hidden",
      })
    ).toEqual({
      isVisible: false,
      state: "hidden",
    });

    expect(
      readVisibilityState({
        hidden: false,
        visibilityState: "prerender",
      })
    ).toEqual({
      isVisible: true,
      state: "prerender",
    });
  });
});
