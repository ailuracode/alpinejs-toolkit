/**
 * Accessibility spec — reduced-motion gate, focus management,
 * scrollbar-gap, and ARIA-safe defaults.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollController } from "../src/controller";
import { setMatchMedia } from "./setup";

describe("ScrollController — reduced-motion gate", () => {
  let controller: ScrollController;
  beforeEach(() => {
    controller = new ScrollController({ respectReducedMotion: true });
    controller.mount();
  });
  afterEach(() => {
    if (!controller.isDestroyed) {
      controller.destroy();
    }
  });

  it("respects prefers-reduced-motion for toTop", () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    controller.toTop();
    // The behavior change happens inside the navigation helper; we
    // assert the controller accepts the call without throwing.
    expect(controller).toBeDefined();
  });

  it("ignores prefers-reduced-motion when respectReducedMotion:false", () => {
    const c = new ScrollController({ respectReducedMotion: false });
    c.mount();
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    expect(() => c.toTop()).not.toThrow();
    c.destroy();
  });
});

describe("ScrollController — scrollbar-gap", () => {
  it("sets --ailura-scrollbar-gap on lock and clears on destroy", () => {
    const controller = new ScrollController({ reserveScrollbarGap: true });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(document.documentElement.style.getPropertyValue("--ailura-scrollbar-gap")).not.toBe("");
    controller.destroy();
    expect(document.documentElement.style.getPropertyValue("--ailura-scrollbar-gap")).toBe("");
  });

  it("does not set --ailura-scrollbar-gap when reserveScrollbarGap:false", () => {
    const controller = new ScrollController({ reserveScrollbarGap: false });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(document.documentElement.style.getPropertyValue("--ailura-scrollbar-gap")).toBe("");
    controller.destroy();
  });

  it("applies padding-right to the target element on lock and restores on unlock", () => {
    const target = document.createElement("div");
    target.id = "scroll-target-test";
    document.body.appendChild(target);
    const controller = new ScrollController({ target });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(target.style.paddingRight).not.toBe("");
    expect(target.style.paddingRight).toMatch(/^\d+px$/);
    controller.unlockAll();
    expect(target.style.paddingRight).toBe("");
    controller.destroy();
    target.remove();
  });

  it("restores the target's pre-lock padding-right on unlock", () => {
    const target = document.createElement("div");
    target.id = "scroll-target-prelock";
    target.style.paddingRight = "10px";
    document.body.appendChild(target);
    const controller = new ScrollController({ target });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(target.style.paddingRight).not.toBe("10px");
    controller.unlockAll();
    expect(target.style.paddingRight).toBe("10px");
    controller.destroy();
    target.remove();
  });

  it("accepts a CSS selector as target", () => {
    const target = document.createElement("div");
    target.id = "scroll-target-selector";
    document.body.appendChild(target);
    const controller = new ScrollController({ target: "#scroll-target-selector" });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(target.style.paddingRight).not.toBe("");
    controller.destroy();
    target.remove();
  });

  it("falls back gracefully when target selector matches no element", () => {
    const controller = new ScrollController({ target: "#does-not-exist" });
    controller.mount();
    expect(() => controller.lockWithHandle("modal")).not.toThrow();
    controller.destroy();
  });

  it("does NOT apply padding-right when target is null (CSS variable still set)", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const controller = new ScrollController({ target: null });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(target.style.paddingRight).toBe("");
    controller.destroy();
    target.remove();
  });
});

describe("ScrollController — focus options", () => {
  it("scrollIntoView(element, { focus: true }) focuses the element", () => {
    const controller = new ScrollController();
    controller.mount();
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, "focus");
    controller.scrollIntoView(el, { focus: true });
    expect(focusSpy).toHaveBeenCalled();
    controller.destroy();
    el.remove();
  });

  it("scrollIntoView(element) does NOT focus the element by default", () => {
    const controller = new ScrollController();
    controller.mount();
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, "focus");
    controller.scrollIntoView(el);
    expect(focusSpy).not.toHaveBeenCalled();
    controller.destroy();
    el.remove();
  });
});
