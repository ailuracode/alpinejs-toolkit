import { beforeAll, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import scrollPlugin, { type ScrollStore } from "../src/index.js";

describe("@ailuracode/alpine-scroll", () => {
  let store: ScrollStore;

  beforeAll(() => {
    vi.stubGlobal("scrollTo", vi.fn());
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 120,
    });
    Object.defineProperty(window, "scrollX", {
      configurable: true,
      value: 0,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1600,
    });

    const Alpine = startAlpine(scrollPlugin);
    store = Alpine.store("scroll") as ScrollStore;
  });

  it("tracks scroll progress", () => {
    store.refresh();
    expect(store.y).toBe(120);
    expect(store.progress).toBeGreaterThan(0);
    expect(store.isAtTop).toBe(false);
  });

  it("locks and unlocks the body with reference counting", () => {
    store.lock();
    expect(store.isLocked).toBe(true);
    expect(document.body.classList.contains("scroll-locked")).toBe(true);

    store.lock();
    store.unlock();
    expect(store.isLocked).toBe(true);

    store.unlock();
    expect(store.isLocked).toBe(false);
    expect(document.body.classList.contains("scroll-locked")).toBe(false);
  });

  it("exposes showToTop when scrolled and unlocked", () => {
    store.refresh();
    expect(store.showToTop).toBe(true);

    store.lock();
    expect(store.showToTop).toBe(false);
    store.unlock();
  });

  it("tracks scroll direction and bottom edge", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 200,
    });
    store.refresh();
    expect(store.direction).toBe("down");
    expect(store.isScrollingDown).toBe(true);

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 100,
    });
    store.refresh();
    expect(store.direction).toBe("up");
    expect(store.isScrollingUp).toBe(true);

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 100,
    });
    store.refresh();
    expect(store.direction).toBe("none");

    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 799,
    });
    store.refresh();
    expect(store.isAtBottom).toBe(true);
    expect(store.atBottom).toBe(true);
  });

  it("toggles lock and scrolls when unlocked", () => {
    const scrollTo = vi.mocked(window.scrollTo);

    store.toggleLock();
    expect(store.isLocked).toBe(true);

    store.toggleLock();
    expect(store.isLocked).toBe(false);

    scrollTo.mockClear();
    store.toTop("auto");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });

    store.toBottom();
    expect(scrollTo).toHaveBeenCalledWith({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  });

  it("skips programmatic scroll while locked", () => {
    const scrollTo = vi.mocked(window.scrollTo);

    store.lock();
    scrollTo.mockClear();
    store.toTop();
    store.toBottom();
    expect(scrollTo).not.toHaveBeenCalled();
    store.unlock();
  });

  it("returns false when refresh state is unchanged", () => {
    store.refresh();
    expect(store.refresh()).toBe(false);
  });

  it("handles zero-height documents", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
    });

    store.refresh();
    expect(store.progress).toBe(0);
    expect(store.atBottom).toBe(true);
  });

  it("ignores unlock when not locked", () => {
    expect(store.unlock()).toBe(false);
  });
});
