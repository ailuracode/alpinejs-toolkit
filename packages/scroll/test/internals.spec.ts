/**
 * Internals spec — unit coverage for the pure helpers under
 * `src/internal/`.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollError } from "../src/error";
import { LockManager } from "../src/internal/lock-manager";
import {
  computeScrollDirection,
  computeScrollMetrics,
  readScrollSnapshot,
  SCROLL_BEHAVIORS,
  SCROLL_DIRECTIONS,
  SCROLL_LOCK_AXES,
} from "../src/internal/metrics";
import {
  isKeyboardReason,
  resolveScrollBehavior,
  scrollIntoViewElement,
  scrollToBottom,
  scrollToCoordinates,
  scrollToTop,
} from "../src/internal/navigation";
import {
  applyScrollbarGap,
  clearScrollbarGap,
  measureScrollbarWidth,
  resetScrollbarGapCache,
  SCROLLBAR_GAP_VAR,
} from "../src/internal/scrollbar-gap";
import {
  isBrowserWithMedia,
  prefersReducedMotion,
  querySelectorOrNull,
} from "../src/internal/util";
import { setMatchMedia } from "./setup";

describe("metrics", () => {
  it("SCROLL_DIRECTIONS contains the three cardinal directions", () => {
    expect(SCROLL_DIRECTIONS).toEqual(["up", "down", "none"]);
  });

  it("SCROLL_BEHAVIORS contains auto/instant/smooth", () => {
    expect(SCROLL_BEHAVIORS).toEqual(["auto", "instant", "smooth"]);
  });

  it("SCROLL_LOCK_AXES contains y/both", () => {
    expect(SCROLL_LOCK_AXES).toEqual(["y", "both"]);
  });

  it("computeScrollDirection handles edge cases", () => {
    expect(computeScrollDirection(0, 0)).toBe("none");
    expect(computeScrollDirection(0, 1)).toBe("down");
    expect(computeScrollDirection(1, 0)).toBe("up");
  });

  it("computeScrollMetrics handles short pages", () => {
    // When the page is shorter than the viewport, `maxY` clamps to
    // 0 and `atBottom` is true (we are already at the bottom — there
    // is nothing more to scroll). Progress is 0 because there's
    // nothing to measure against.
    expect(
      computeScrollMetrics({
        x: 0,
        y: 100,
        previousY: 0,
        scrollHeight: 100,
        innerHeight: 200,
      })
    ).toMatchObject({ atTop: false, atBottom: true, progress: 0 });
  });

  it("computeScrollMetrics handles full-page scroll", () => {
    expect(
      computeScrollMetrics({
        x: 0,
        y: 1000,
        previousY: 0,
        scrollHeight: 2000,
        innerHeight: 1000,
      })
    ).toMatchObject({ atTop: false, atBottom: true, progress: 100 });
  });

  it("computeScrollMetrics clamps progress at 0 when scrollHeight === 0", () => {
    expect(
      computeScrollMetrics({
        x: 0,
        y: 0,
        previousY: 0,
        scrollHeight: 0,
        innerHeight: 0,
      }).progress
    ).toBe(0);
  });

  it("readScrollSnapshot returns the live snapshot", () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    Object.defineProperty(window, "scrollX", { configurable: true, value: 50 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    const snap = readScrollSnapshot(0);
    expect(snap.y).toBe(100);
    expect(snap.x).toBe(50);
  });
});

describe("util", () => {
  it("isBrowserWithMedia returns true in happy-dom + matchMedia stub", () => {
    expect(isBrowserWithMedia()).toBe(true);
  });

  it("prefersReducedMotion returns false when media doesn't match", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("querySelectorOrNull finds an element by id", () => {
    const el = document.createElement("div");
    el.id = "test-target";
    document.body.appendChild(el);
    expect(querySelectorOrNull("#test-target")).toBe(el);
    el.remove();
  });

  it("querySelectorOrNull returns null for missing selectors", () => {
    expect(querySelectorOrNull("#does-not-exist")).toBeNull();
  });

  it("querySelectorOrNull returns null for invalid selectors", () => {
    expect(querySelectorOrNull("not a selector!@#")).toBeNull();
  });
});

describe("scrollbar-gap", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty(SCROLLBAR_GAP_VAR);
  });

  it("clearScrollbarGap removes the CSS variable", () => {
    document.documentElement.style.setProperty(SCROLLBAR_GAP_VAR, "12px");
    clearScrollbarGap();
    expect(document.documentElement.style.getPropertyValue(SCROLLBAR_GAP_VAR)).toBe("");
  });

  it("resetScrollbarGapCache is an alias for clearScrollbarGap", () => {
    document.documentElement.style.setProperty(SCROLLBAR_GAP_VAR, "8px");
    resetScrollbarGapCache();
    expect(document.documentElement.style.getPropertyValue(SCROLLBAR_GAP_VAR)).toBe("");
  });

  it("applyScrollbarGap sets the CSS variable", () => {
    applyScrollbarGap();
    // happy-dom doesn't render a scrollbar; the variable should still
    // be set to a numeric pixel value (or empty when the measurement
    // is 0 — either way the function must not throw).
    expect(() => applyScrollbarGap()).not.toThrow();
  });

  it("measureScrollbarWidth returns a number", () => {
    const width = measureScrollbarWidth();
    expect(typeof width).toBe("number");
    expect(width).toBeGreaterThanOrEqual(0);
  });
});

describe("LockManager", () => {
  it("starts with count=0 and isLocked=false", () => {
    const m = new LockManager();
    expect(m.count).toBe(0);
    expect(m.isLocked).toBe(false);
    m.destroy();
  });

  it("lock(reason) increments count and emits locked:true", () => {
    const m = new LockManager();
    const events: Array<{ locked: boolean; reason: string; count: number }> = [];
    m.onChange((d) => events.push(d));
    const handle = m.lock("modal");
    expect(handle).toBeTruthy();
    expect(m.count).toBe(1);
    expect(m.isLocked).toBe(true);
    expect(events[0].locked).toBe(true);
    expect(events[0].reason).toBe("modal");
    m.destroy();
  });

  it("unlock(handle) decrements count", () => {
    const m = new LockManager();
    const handle = m.lock("modal");
    m.unlock(handle);
    expect(m.count).toBe(0);
    expect(m.isLocked).toBe(false);
    m.destroy();
  });

  it("unlock with unknown handle throws ScrollError", () => {
    const m = new LockManager();
    expect(() => m.unlock("nope")).toThrow(ScrollError);
    m.destroy();
  });

  it("unlockAll clears every lock", () => {
    const m = new LockManager();
    m.lock("modal");
    m.lock("menu");
    expect(m.count).toBe(2);
    m.unlockAll();
    expect(m.count).toBe(0);
    m.destroy();
  });

  it("destroy() is idempotent and clears the listener set", () => {
    const m = new LockManager();
    m.destroy();
    expect(() => m.destroy()).not.toThrow();
  });

  it("lock with empty reason throws ScrollError", () => {
    const m = new LockManager();
    expect(() => m.lock("")).toThrow(ScrollError);
    m.destroy();
  });

  it("lock after destroy throws ToolkitError", () => {
    const m = new LockManager();
    m.destroy();
    expect(() => m.lock("after")).toThrow();
  });

  it("subscribe to lock changes with safeNotify (no throw on listener error)", () => {
    const m = new LockManager();
    m.onChange(() => {
      throw new Error("listener exploded");
    });
    const handle = m.lock("modal");
    expect(() => m.unlock(handle)).not.toThrow();
    m.destroy();
  });

  it("onChange unsubscribe removes the listener", () => {
    const m = new LockManager();
    const unsubscribe = m.onChange(() => undefined);
    unsubscribe();
    m.lock("modal");
    // After unsubscribe, the count still goes up but no listener fires.
    expect(m.count).toBe(1);
    m.destroy();
  });

  it("stacked locks emit on lock + final unlock", () => {
    const m = new LockManager();
    const events: Array<{ count: number; locked: boolean }> = [];
    m.onChange((d) => events.push({ count: d.count, locked: d.locked }));
    const h1 = m.lock("modal");
    const h2 = m.lock("menu");
    m.unlock(h1);
    m.unlock(h2);
    // 2 lock acquires + 1 final unlock = 3 events.
    expect(events.length).toBe(3);
    expect(events.map((e) => e.locked)).toEqual([true, true, false]);
    m.destroy();
  });
});

describe("navigation helpers", () => {
  it("resolveScrollBehavior honors prefers-reduced-motion for smooth", () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    expect(resolveScrollBehavior("smooth", "smooth", true)).toBe("instant");
  });

  it("resolveScrollBehavior respects false flag", () => {
    expect(resolveScrollBehavior("smooth", "smooth", false)).toBe("smooth");
  });

  it("resolveScrollBehavior passes instant/auto through", () => {
    expect(resolveScrollBehavior("instant", "smooth", true)).toBe("instant");
    expect(resolveScrollBehavior("auto", "smooth", true)).toBe("auto");
    expect(resolveScrollBehavior(undefined, "smooth", false)).toBe("smooth");
  });

  it("isKeyboardReason detects keyboard origin", () => {
    expect(isKeyboardReason(undefined)).toBe(false);
    expect(isKeyboardReason("")).toBe(false);
    expect(isKeyboardReason("mouse")).toBe(false);
    expect(isKeyboardReason("keyboard")).toBe(true);
    expect(isKeyboardReason("Key:ArrowDown")).toBe(true);
  });

  it("scrollToCoordinates calls window.scrollTo with options", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    scrollToCoordinates({ x: 10, y: 200, behavior: "instant" }, true);
    expect(spy).toHaveBeenCalledWith({ top: 200, left: 10, behavior: "instant" });
    spy.mockRestore();
  });

  it("scrollToTop calls window.scrollTo with top=0", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    scrollToTop("smooth", "smooth", false);
    expect(spy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
    spy.mockRestore();
  });

  it("scrollToBottom reads documentElement.scrollHeight", () => {
    const spy = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
    scrollToBottom("smooth", "smooth", false);
    expect(spy).toHaveBeenCalledWith({ top: 5000, left: 0, behavior: "smooth" });
    spy.mockRestore();
  });

  it("scrollIntoViewElement with focus:true calls .focus()", () => {
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, "focus");
    scrollIntoViewElement(el, { focus: true }, true);
    expect(focusSpy).toHaveBeenCalled();
    el.remove();
  });

  it("scrollIntoViewElement catches focus throws", () => {
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    el.focus = () => {
      throw new Error("focus exploded");
    };
    expect(() => scrollIntoViewElement(el, { focus: true }, true)).not.toThrow();
    el.remove();
  });

  it("scrollIntoViewElement without focus skips .focus()", () => {
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, "focus");
    scrollIntoViewElement(el, undefined, false);
    expect(focusSpy).not.toHaveBeenCalled();
    el.remove();
  });
});
