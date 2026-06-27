import { beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import scrollPlugin, {
  computeScrollDirection,
  computeScrollMetrics,
  readScrollSnapshot,
  SCROLL_BEHAVIORS,
  SCROLL_DIRECTIONS,
  type ScrollDirection,
  type ScrollSnapshot,
  type ScrollStore,
  scrollOptions,
} from "../src/index.js";

describe("@ailuracode/alpinejs-scroll type inference", () => {
  it("exports literal scroll directions and behaviors", () => {
    expectTypeOf(SCROLL_DIRECTIONS).toEqualTypeOf<readonly ["up", "down", "none"]>();
    expectTypeOf(SCROLL_BEHAVIORS).toEqualTypeOf<readonly ["auto", "instant", "smooth"]>();
  });

  it("types computeScrollDirection()", () => {
    expectTypeOf(computeScrollDirection(0, 10)).toEqualTypeOf<ScrollDirection>();
  });

  it("types computeScrollMetrics()", () => {
    const snapshot = computeScrollMetrics({
      x: 0,
      y: 120,
      previousY: 80,
      scrollHeight: 1600,
      innerHeight: 800,
    });

    expectTypeOf(snapshot).toEqualTypeOf<ScrollSnapshot>();
    expectTypeOf(snapshot.direction).toEqualTypeOf<ScrollDirection>();
  });

  it("types scrollOptions()", () => {
    const options = scrollOptions({
      onLockChange(locked) {
        expectTypeOf(locked).toEqualTypeOf<boolean>();
      },
    });

    expectTypeOf(options.onLockChange).parameters.toEqualTypeOf<[locked: boolean]>();
  });

  it("types $store.scroll", () => {
    const Alpine = startAlpine(scrollPlugin());
    const scroll = Alpine.store("scroll") as ScrollStore;

    expectTypeOf(scroll.direction).toEqualTypeOf<ScrollDirection>();
    expectTypeOf(scroll.isDirection).parameters.toEqualTypeOf<[direction: ScrollDirection]>();
    expectTypeOf(scroll.toTop).parameters.toEqualTypeOf<[behavior?: ScrollBehavior | undefined]>();
  });
});

describe("@ailuracode/alpinejs-scroll", () => {
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

    const Alpine = startAlpine(scrollPlugin());
    store = Alpine.store("scroll") as ScrollStore;
  });

  it("computes scroll metrics from viewport values", () => {
    expect(
      computeScrollMetrics({
        x: 0,
        y: 120,
        previousY: 80,
        scrollHeight: 1600,
        innerHeight: 800,
      })
    ).toEqual({
      x: 0,
      y: 120,
      direction: "down",
      atTop: false,
      atBottom: false,
      progress: 15,
    });
  });

  it("reads scroll snapshot from the viewport", () => {
    expect(readScrollSnapshot(80)).toMatchObject({
      y: 120,
      direction: "down",
    });
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
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.overflow).toBe("hidden");

    store.lock();
    store.unlock();
    expect(store.isLocked).toBe(true);

    store.unlock();
    expect(store.isLocked).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.position).toBe("");
  });

  it("calls onLockChange when lock state changes", () => {
    const onLockChange = vi.fn();
    const Alpine = startAlpine(scrollPlugin({ onLockChange }));
    const lockedStore = Alpine.store("scroll") as ScrollStore;

    lockedStore.lock();
    expect(onLockChange).toHaveBeenLastCalledWith(true);

    lockedStore.unlock();
    expect(onLockChange).toHaveBeenLastCalledWith(false);
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

  it("toggleLock() decrements nested lock ref-count once", () => {
    store.lock();
    store.lock();
    expect(store.isLocked).toBe(true);

    store.toggleLock();
    expect(store.isLocked).toBe(true);

    store.toggleLock();
    expect(store.isLocked).toBe(false);
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

  it("restores scroll position instantly on unlock", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 400,
    });
    store.refresh();
    store.lock();

    const scrollTo = vi.mocked(window.scrollTo);
    scrollTo.mockClear();
    store.unlock();

    expect(scrollTo).toHaveBeenCalledWith({ top: 400, left: 0, behavior: "instant" });
  });

  it("ignores unlock when not locked", () => {
    expect(store.unlock()).toBe(false);
  });
});
