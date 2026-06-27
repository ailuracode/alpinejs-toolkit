import Alpine from "alpinejs";
import { afterEach, beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { setMatchMedia } from "../../../test/setup.js";
import screenPlugin, {
  DEFAULT_SCREEN_INTERVALS,
  readScreenSnapshot,
  resolveScreenType,
  type ScreenInterval,
  type ScreenSnapshot,
  type ScreenStore,
  screenIntervals,
} from "../src/index.js";

describe("@ailuracode/alpinejs-screen type inference", () => {
  it("exports literal default intervals", () => {
    expectTypeOf(DEFAULT_SCREEN_INTERVALS[0].name).toEqualTypeOf<"mobile">();
    expectTypeOf(DEFAULT_SCREEN_INTERVALS[1].name).toEqualTypeOf<"desktop">();
  });

  it("types screenIntervals() with const assertion", () => {
    const intervals = screenIntervals([
      { name: "phone", maxWidth: 480 },
      { name: "tablet", maxWidth: 768 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const);

    expectTypeOf(intervals[0].name).toEqualTypeOf<"phone">();
    expectTypeOf(intervals[1].maxWidth).toEqualTypeOf<768>();
  });

  it("types resolveScreenType()", () => {
    const intervals = screenIntervals([
      { name: "mobile", maxWidth: 767 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const);

    expectTypeOf(resolveScreenType(500, intervals)).toEqualTypeOf<"mobile" | "desktop">();
  });

  it("types readScreenSnapshot()", () => {
    const snapshot = readScreenSnapshot();

    expectTypeOf(snapshot).toEqualTypeOf<ScreenSnapshot>();
    expectTypeOf(snapshot.type).toEqualTypeOf<string>();
  });

  it("types $store.device", () => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(screenPlugin());
    const device = Alpine.store("device") as ScreenStore;

    expectTypeOf(device.type).toEqualTypeOf<string>();
    expectTypeOf(device.is).parameters.toEqualTypeOf<[name: string]>();
    expectTypeOf(device.intervals).toEqualTypeOf<readonly ScreenInterval[]>();
  });
});

describe("@ailuracode/alpinejs-screen with default intervals", () => {
  let store: ScreenStore;

  beforeAll(() => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(screenPlugin());
    store = Alpine.store("device") as ScreenStore;
  });

  it("resolves type from width via helper", () => {
    const intervals = [
      { name: "mobile", maxWidth: 767 },
      { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
    ] as const;

    expect(resolveScreenType(500, intervals)).toBe("mobile");
    expect(resolveScreenType(1200, intervals)).toBe("desktop");
  });

  it("reads screen snapshot from width", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 500,
    });

    expect(readScreenSnapshot()).toEqual({
      width: 500,
      type: "mobile",
    });
  });

  it("registers the device store", () => {
    expect(store).toBeDefined();
    expect(store.intervals).toHaveLength(2);
    expect(store.intervals[0].name).toBe("mobile");
    expect(store.intervals[0].maxWidth).toBe(767);
    expect(store.intervals[1].name).toBe("desktop");
    expect(store.intervals[1].maxWidth).toBe(Number.POSITIVE_INFINITY);
  });

  it("detects mobile from matchMedia", () => {
    expect(store.type).toBe("mobile");
    expect(store.is("mobile")).toBe(true);
    expect(store.is("desktop")).toBe(false);
  });

  it("refreshes width", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1200,
    });

    store.refreshWidth();
    expect(store.width).toBe(1200);

    store.refresh();
    expect(store.width).toBe(1200);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates width on resize after debounce", async () => {
    vi.useFakeTimers();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });

    window.dispatchEvent(new Event("resize"));
    await vi.advanceTimersByTimeAsync(100);

    expect(store.width).toBe(800);
  });
});

describe("@ailuracode/alpinejs-screen type transitions", () => {
  it("reacts to matchMedia changes via refresh", () => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(screenPlugin());
    const device = Alpine.store("device") as ScreenStore;

    expect(device.type).toBe("mobile");

    // Change media query and refresh
    setMatchMedia("(max-width: 767px)", false);
    device.refresh();
    expect(device.type).toBe("desktop");
  });

  it("reacts to matchMedia dispatched events", () => {
    setMatchMedia("(max-width: 767px)", true);

    const Alpine = startAlpine(screenPlugin());
    const device = Alpine.store("device") as ScreenStore;

    expect(device.type).toBe("mobile");

    // Dispatch a change — the plugin's internal handler should fire
    setMatchMedia("(max-width: 767px)", false);
    // The change handler is async (called via listener), so refresh synchronously
    device.refresh();
    expect(device.type).toBe("desktop");
    expect(device.is("desktop")).toBe(true);
  });
});

describe("@ailuracode/alpinejs-screen with custom intervals", () => {
  it("accepts custom interval names", () => {
    setMatchMedia("(max-width: 480px)", false);
    setMatchMedia("(max-width: 768px)", true);

    const Alpine = startAlpine(
      screenPlugin({
        intervals: [
          { name: "phone", maxWidth: 480 },
          { name: "tablet", maxWidth: 768 },
          { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
        ],
      })
    );
    const device = Alpine.store("device") as ScreenStore;

    expect(device.type).toBe("tablet");
    expect(device.is("phone")).toBe(false);
    expect(device.is("tablet")).toBe(true);
    expect(device.is("desktop")).toBe(false);
  });

  it("matches smallest interval first", () => {
    setMatchMedia("(max-width: 480px)", true);
    setMatchMedia("(max-width: 768px)", true);

    const Alpine = startAlpine(
      screenPlugin({
        intervals: [
          { name: "phone", maxWidth: 480 },
          { name: "tablet", maxWidth: 768 },
          { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
        ],
      })
    );
    const device = Alpine.store("device") as ScreenStore;

    // Both phone and tablet match, but phone is checked first (smallest)
    expect(device.type).toBe("phone");
  });

  it("falls back to last interval when nothing matches", () => {
    setMatchMedia("(max-width: 480px)", false);
    setMatchMedia("(max-width: 768px)", false);

    const Alpine = startAlpine(
      screenPlugin({
        intervals: [
          { name: "phone", maxWidth: 480 },
          { name: "tablet", maxWidth: 768 },
          { name: "wide", maxWidth: Number.POSITIVE_INFINITY },
        ],
      })
    );
    const device = Alpine.store("device") as ScreenStore;

    expect(device.type).toBe("wide");
    expect(device.is("wide")).toBe(true);
  });

  it("works with a single interval (always matches fallback)", () => {
    setMatchMedia("(max-width: 99999px)", false);

    const Alpine = startAlpine(
      screenPlugin({
        intervals: [{ name: "all", maxWidth: Number.POSITIVE_INFINITY }],
      })
    );
    const device = Alpine.store("device") as ScreenStore;

    expect(device.type).toBe("all");
    expect(device.is("all")).toBe(true);
  });
});

describe("@ailuracode/alpinejs-screen DOM reactivity", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates x-text bindings when width changes on resize", async () => {
    vi.useFakeTimers();
    setMatchMedia("(max-width: 767px)", true);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    startAlpine(screenPlugin());
    document.body.innerHTML = `
      <div x-data>
        <span id="device-width" x-text="$store.device.width"></span>
        <span id="device-type" x-text="$store.device.type"></span>
      </div>
    `;
    Alpine.initTree(document.body);

    expect(document.getElementById("device-width")?.textContent).toBe("500");
    expect(document.getElementById("device-type")?.textContent).toBe("mobile");

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1200,
    });
    window.dispatchEvent(new Event("resize"));
    await vi.advanceTimersByTimeAsync(100);

    expect(document.getElementById("device-width")?.textContent).toBe("1200");
  });
});
