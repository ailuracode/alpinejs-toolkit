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

  it("ignores non-primary button on pointerdown", () => {
    const panel = document.createElement("section");
    document.body.append(panel);
    const handle = document.createElement("div");
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(false);
    document.body.append(handle);

    const unbind = bindMobilePanelResize({
      panel,
      handle,
      onResize: vi.fn(),
    });

    // Right click — should be ignored
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientY: 300, button: 2, pointerId: 1 })
    );

    expect(handle.setPointerCapture).not.toHaveBeenCalled();
    unbind();
    panel.remove();
    handle.remove();
  });

  it("pointermove without dragging is ignored", () => {
    const panel = document.createElement("section");
    document.body.append(panel);
    const handle = document.createElement("div");
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(false);
    document.body.append(handle);

    const onResize = vi.fn();
    const unbind = bindMobilePanelResize({
      panel,
      handle,
      onResize,
    });

    // pointermove without prior pointerdown — should be ignored
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientY: 260, pointerId: 1 })
    );

    expect(onResize).not.toHaveBeenCalled();
    unbind();
    panel.remove();
    handle.remove();
  });

  it("pointerup without dragging is ignored", () => {
    const panel = document.createElement("section");
    document.body.append(panel);
    const handle = document.createElement("div");
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(false);
    document.body.append(handle);

    const unbind = bindMobilePanelResize({
      panel,
      handle,
      onResize: vi.fn(),
    });

    // pointerup without prior pointerdown — should be ignored
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));

    expect(handle.releasePointerCapture).not.toHaveBeenCalled();
    unbind();
    panel.remove();
    handle.remove();
  });

  it("getDefaultMobilePanelHeight returns minimum when window is undefined", async () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error: simulating SSR
    delete globalThis.window;
    const { getDefaultMobilePanelHeight } = await import("../src/devtools/panel-resize.js");
    expect(getDefaultMobilePanelHeight()).toBe(MOBILE_PANEL_MIN_HEIGHT);
    globalThis.window = originalWindow;
  });

  it("endDrag handles missing pointer capture", () => {
    const panel = document.createElement("section");
    document.body.append(panel);
    const handle = document.createElement("div");
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    handle.hasPointerCapture = vi.fn().mockReturnValue(false);
    document.body.append(handle);

    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue({ height: 500 } as DOMRect);

    const unbind = bindMobilePanelResize({
      panel,
      handle,
      onResize: vi.fn(),
    });

    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientY: 300, button: 0, pointerId: 1 })
    );
    // hasPointerCapture returns false, so releasePointerCapture should not be called
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));

    expect(handle.releasePointerCapture).not.toHaveBeenCalled();
    unbind();
    panel.remove();
    handle.remove();
  });
});
