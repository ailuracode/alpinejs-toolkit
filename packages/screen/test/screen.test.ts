import { beforeAll, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { setMatchMedia } from "../../../test/setup.js";
import screenPlugin, { type DeviceStore } from "../src/index.js";

describe("@ailuracode/alpine-screen", () => {
  let store: DeviceStore;

  beforeAll(() => {
    setMatchMedia("(max-width: 767px)", true);
    setMatchMedia("(min-width: 768px) and (max-width: 1023px)", false);

    const Alpine = startAlpine(screenPlugin);
    store = Alpine.store("device") as DeviceStore;
  });

  it("registers the device store", () => {
    expect(store).toBeDefined();
    expect(store.mobileMax).toBe(767);
    expect(store.tabletMax).toBe(1023);
  });

  it("detects mobile from matchMedia", () => {
    expect(store.type).toBe("mobile");
    expect(store.isMobile).toBe(true);
    expect(store.is("mobile")).toBe(true);
  });

  it("updates breakpoints", () => {
    store.setBreakpoints({ mobileMax: 500, tabletMax: 900 });
    expect(store.mobileMax).toBe(500);
    expect(store.tabletMax).toBe(900);
  });

  it("refreshes width and type", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1200,
    });

    store.refreshWidth();
    expect(store.width).toBe(1200);
    store.refresh();
    expect(store.width).toBe(1200);
  });

  it("reacts to media query changes", () => {
    setMatchMedia("(max-width: 767px)", false);
    setMatchMedia("(min-width: 768px) and (max-width: 1023px)", true);
    store.setBreakpoints({ mobileMax: 767, tabletMax: 1023 });

    expect(store.type).toBe("tablet");
    expect(store.isTablet).toBe(true);
    expect(store.is("tablet")).toBe(true);
  });

  it("debounces resize updates", () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 800,
    });

    window.dispatchEvent(new Event("resize"));
    vi.advanceTimersByTime(100);

    expect(store.width).toBe(800);
    vi.useRealTimers();
  });
});

describe("@ailuracode/alpine-screen desktop", () => {
  it("detects desktop from matchMedia", () => {
    setMatchMedia("(max-width: 767px)", false);
    setMatchMedia("(min-width: 768px) and (max-width: 1023px)", false);

    const Alpine = startAlpine(screenPlugin);
    const device = Alpine.store("device") as DeviceStore;

    expect(device.type).toBe("desktop");
    expect(device.isDesktop).toBe(true);
    expect(device.is("desktop")).toBe(true);
  });

  it("updates only provided breakpoint values", () => {
    setMatchMedia("(max-width: 767px)", false);
    setMatchMedia("(min-width: 768px) and (max-width: 1023px)", false);

    const Alpine = startAlpine(screenPlugin);
    const device = Alpine.store("device") as DeviceStore;

    device.setBreakpoints({ mobileMax: 600 });
    expect(device.mobileMax).toBe(600);
    expect(device.tabletMax).toBe(1023);
  });
});
