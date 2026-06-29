import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bindMobilePanelResize,
  clampMobilePanelHeight,
  getMaxMobilePanelHeight,
  getMinMobilePanelHeight,
  MOBILE_PANEL_MIN_HEIGHT,
  resolveMobilePanelHeight,
} from "../src/devtools/panel-resize.js";
import { applyStyle } from "../src/devtools/style-utils.js";

describe("panel-resize", () => {
  beforeEach(() => {
    vi.stubGlobal("innerHeight", 800);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clamps mobile panel height to at least 400px when the viewport allows it", () => {
    expect(getMinMobilePanelHeight()).toBe(MOBILE_PANEL_MIN_HEIGHT);
    expect(clampMobilePanelHeight(320)).toBe(MOBILE_PANEL_MIN_HEIGHT);
    expect(clampMobilePanelHeight(520)).toBe(520);
  });

  it("caps mobile panel height to the viewport maximum", () => {
    expect(clampMobilePanelHeight(900)).toBe(getMaxMobilePanelHeight());
  });

  it("resolves stored height with clamping", () => {
    expect(resolveMobilePanelHeight(460)).toBe(460);
    expect(resolveMobilePanelHeight(null)).toBe(clampMobilePanelHeight(800 * 0.92));
  });

  it("updates panel height while dragging the resize handle", () => {
    const panel = document.createElement("section");
    applyStyle(panel, { height: "500px" });
    document.body.append(panel);

    const handle = document.createElement("div");
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(true);
    document.body.append(handle);

    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({
      height: 500,
    } as DOMRect);

    const heights: number[] = [];
    const unbind = bindMobilePanelResize({
      panel,
      handle,
      onResize: (height) => {
        heights.push(height);
      },
    });

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientY: 300, button: 0, pointerId: 1 })
    );
    handle.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientY: 260, pointerId: 1 })
    );
    handle.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));

    expect(heights.at(-1)).toBe(540);
    expect(Number.parseInt(panel.style.height, 10)).toBeGreaterThanOrEqual(MOBILE_PANEL_MIN_HEIGHT);

    unbind();
    panel.remove();
    handle.remove();
  });
});
