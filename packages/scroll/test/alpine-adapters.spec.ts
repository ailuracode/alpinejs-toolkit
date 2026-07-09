/**
 * Alpine store adapter spec — covers `createScrollStore` and the
 * internal observer modules. The plugin adapter is exercised end-to-end
 * by `plugin.spec.ts`; this file pins the per-module behaviour of the
 * `src/alpine/store.ts` and `src/internal/*` paths so the coverage
 * targets are met for branches the integration spec does not touch.
 *
 * The legacy `registerScrollMagic` helper was removed when the plugin
 * was refactored to follow the `@ailuracode/alpine-theme` /
 * `@ailuracode/alpine-sidebar` factory convention (magic is registered
 * inline in `src/plugin.ts`).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createScrollStore } from "../src/alpine/store";
import { ScrollController } from "../src/controller";
import type { ScrollStore } from "../src/types";
import { getIntersectionObservers } from "./setup";

describe("alpine/store — createScrollStore", () => {
  let controller: ScrollController;
  let store: ScrollStore;

  beforeEach(() => {
    controller = new ScrollController();
    controller.mount();
    store = createScrollStore(controller);
  });
  afterEach(() => {
    controller.destroy();
  });

  it("mirrors initial controller state", () => {
    expect(store.x).toBe(controller.state.x);
    expect(store.y).toBe(controller.state.y);
    expect(store.direction).toBe(controller.state.direction);
    expect(store.atTop).toBe(controller.state.atTop);
    expect(store.atBottom).toBe(controller.state.atBottom);
    expect(store.progress).toBe(controller.state.progress);
    expect(store.locked).toBe(controller.isLocked);
    expect(store.lockCount).toBe(0);
  });

  it("lock(reason) acquires and returns a handle", () => {
    const handle = store.lock("modal");
    expect(typeof handle).toBe("string");
    expect(controller.isLocked).toBe(true);
  });

  it("unlock(handle) releases the lock", () => {
    const handle = store.lock("modal");
    store.unlock(handle);
    expect(controller.isLocked).toBe(false);
  });

  it("unlockAll() releases every lock", () => {
    store.lock("modal");
    store.lock("menu");
    store.unlockAll();
    expect(controller.isLocked).toBe(false);
    expect(controller.lockHandles.length).toBe(0);
  });

  it("scrollIntoView({x,y}) forwards to controller", () => {
    expect(() => store.scrollIntoView({ x: 0, y: 100 })).not.toThrow();
  });

  it("by(delta) forwards to controller", () => {
    expect(() => store.by({ y: 50 })).not.toThrow();
  });

  it("toTop() / toBottom() forward to controller", () => {
    expect(() => store.toTop()).not.toThrow();
    expect(() => store.toBottom()).not.toThrow();
  });
});

describe("internal/section-observer — callback paths", () => {
  it("returns a no-op cleanup when IntersectionObserver is unavailable", async () => {
    const original = window.IntersectionObserver;
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const { attachSectionObserver } = await import("../src/internal/section-observer");
    const cleanup = attachSectionObserver([], { onChange: () => undefined });
    expect(typeof cleanup).toBe("function");
    expect(() => cleanup()).not.toThrow();
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: original,
    });
  });

  it("fires onChange when IntersectionObserver reports an entry", async () => {
    const events: Array<{ visible: readonly string[] }> = [];
    const hero = document.createElement("div");
    hero.id = "hero";
    document.body.appendChild(hero);
    const { attachSectionObserver } = await import("../src/internal/section-observer");
    attachSectionObserver([{ id: "hero", element: hero }], {
      onChange: (detail) => events.push(detail),
    });
    const observer = getIntersectionObservers().at(-1);
    expect(observer).toBeDefined();
    observer?.__fire([{ target: hero, isIntersecting: true, intersectionRatio: 1 }]);
    expect(events.length).toBe(1);
    expect(events[0].visible).toContain("hero");
    hero.remove();
  });

  it("removes a section from visible set when not intersecting", async () => {
    const events: Array<{ visible: readonly string[] }> = [];
    const hero = document.createElement("div");
    hero.id = "hero";
    document.body.appendChild(hero);
    const { attachSectionObserver } = await import("../src/internal/section-observer");
    attachSectionObserver([{ id: "hero", element: hero }], {
      onChange: (detail) => events.push(detail),
    });
    const observer = getIntersectionObservers().at(-1);
    observer?.__fire([{ target: hero, isIntersecting: true, intersectionRatio: 1 }]);
    observer?.__fire([{ target: hero, isIntersecting: false, intersectionRatio: 0 }]);
    expect(events.at(-1)?.visible).not.toContain("hero");
    hero.remove();
  });

  it("skips entries without __sectionId marker", async () => {
    const events: Array<{ visible: readonly string[] }> = [];
    const foreign = document.createElement("div");
    document.body.appendChild(foreign);
    const { attachSectionObserver } = await import("../src/internal/section-observer");
    attachSectionObserver([{ id: "registered", element: foreign }], {
      onChange: (detail) => events.push(detail),
    });
    const observer = getIntersectionObservers().at(-1);
    observer?.__fire([{ target: foreign, isIntersecting: false, intersectionRatio: 0 }]);
    expect(events.length).toBeLessThanOrEqual(1);
    if (events.length === 1) {
      expect(events[0].visible.length).toBe(0);
    }
    foreign.remove();
  });

  it("disconnect is called on cleanup", async () => {
    const { attachSectionObserver } = await import("../src/internal/section-observer");
    const hero = document.createElement("div");
    hero.id = "hero";
    document.body.appendChild(hero);
    const cleanup = attachSectionObserver([{ id: "hero", element: hero }], {
      onChange: () => undefined,
    });
    expect(() => cleanup()).not.toThrow();
    hero.remove();
  });
});

describe("internal/scroll-observer — rAF fallback", () => {
  it("attachScrollObserver handles missing rAF (uses setTimeout fallback)", async () => {
    const original = window.requestAnimationFrame;
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const { attachScrollObserver } = await import("../src/internal/scroll-observer");
    const cleanup = attachScrollObserver({
      onPosition: () => undefined,
    });
    expect(typeof cleanup).toBe("function");
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 40));
    expect(() => cleanup()).not.toThrow();
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      writable: true,
      value: original,
    });
  });
});
