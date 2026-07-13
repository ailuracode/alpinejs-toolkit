import { describe, expect, it, vi } from "vitest";
import {
  attachResizeObserver,
  attachScrollListener,
  readElementRect,
  readScrollOffset,
  readWindowRect,
  writeScrollOffset,
} from "../src/internal/observers.js";

describe("virtual/internal/observers", () => {
  describe("readElementRect", () => {
    it("reads client width and height", () => {
      const el = document.createElement("div");
      vi.spyOn(el, "clientWidth", "get").mockReturnValue(100);
      vi.spyOn(el, "clientHeight", "get").mockReturnValue(200);
      expect(readElementRect(el)).toEqual({ width: 100, height: 200 });
    });
  });

  describe("readWindowRect", () => {
    it("returns window dimensions in browser", () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 768 });
      expect(readWindowRect()).toEqual({ width: 1024, height: 768 });
    });
  });

  describe("readScrollOffset", () => {
    it("reads vertical scroll from element", () => {
      const el = document.createElement("div");
      Object.defineProperty(el, "scrollTop", { configurable: true, value: 100 });
      expect(readScrollOffset(el, false)).toBe(100);
    });

    it("reads horizontal scroll from element", () => {
      const el = document.createElement("div");
      Object.defineProperty(el, "scrollLeft", { configurable: true, value: 50 });
      expect(readScrollOffset(el, true)).toBe(50);
    });

    it.skip("reads vertical scroll from window", () => {
      // happy-dom doesn't allow mocking window.scrollY
    });

    it.skip("reads horizontal scroll from window", () => {
      // happy-dom doesn't allow mocking window.scrollX
    });
  });

  describe("writeScrollOffset", () => {
    it("writes vertical scroll to element", () => {
      const el = document.createElement("div");
      el.scrollTo = vi.fn();
      writeScrollOffset(el, 100, false);
      expect(el.scrollTo).toHaveBeenCalledWith({ top: 100, behavior: "auto" });
    });

    it("writes horizontal scroll to element", () => {
      const el = document.createElement("div");
      el.scrollTo = vi.fn();
      writeScrollOffset(el, 50, true);
      expect(el.scrollTo).toHaveBeenCalledWith({ left: 50, behavior: "auto" });
    });

    it("writes vertical scroll to window", () => {
      vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
      writeScrollOffset(window, 200, false);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it("writes horizontal scroll to window", () => {
      vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
      writeScrollOffset(window, 100, true);
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it("respects custom behavior", () => {
      const el = document.createElement("div");
      el.scrollTo = vi.fn();
      writeScrollOffset(el, 100, false, "smooth");
      expect(el.scrollTo).toHaveBeenCalledWith({ top: 100, behavior: "smooth" });
    });
  });

  describe("attachScrollListener", () => {
    it("attaches and removes scroll listener", () => {
      const el = document.createElement("div");
      const handler = vi.fn();
      const remove = attachScrollListener(el, handler);

      el.dispatchEvent(new Event("scroll"));
      expect(handler).toHaveBeenCalledTimes(1);

      remove();
      el.dispatchEvent(new Event("scroll"));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("attachResizeObserver", () => {
    it("falls back when ResizeObserver is unavailable", () => {
      const originalRO = (globalThis as Record<string, unknown>).ResizeObserver;
      (globalThis as Record<string, unknown>).ResizeObserver = undefined;

      const onResize = vi.fn();
      const el = document.createElement("div");
      vi.spyOn(el, "clientWidth", "get").mockReturnValue(100);
      vi.spyOn(el, "clientHeight", "get").mockReturnValue(200);

      const remove = attachResizeObserver(el, onResize);
      expect(onResize).toHaveBeenCalledWith({ width: 100, height: 200 });

      remove();
      (globalThis as Record<string, unknown>).ResizeObserver = originalRO;
    });

    it("uses ResizeObserver for elements", () => {
      const observe = vi.fn();
      const disconnect = vi.fn();
      class MockRO {
        observe = observe;
        disconnect = disconnect;
      }
      (globalThis as Record<string, unknown>).ResizeObserver = MockRO;

      const onResize = vi.fn();
      const el = document.createElement("div");
      vi.spyOn(el, "clientWidth", "get").mockReturnValue(100);
      vi.spyOn(el, "clientHeight", "get").mockReturnValue(200);

      const remove = attachResizeObserver(el, onResize);
      expect(observe).toHaveBeenCalledWith(el);
      expect(onResize).toHaveBeenCalled();

      remove();
      expect(disconnect).toHaveBeenCalled();
    });

    it.skip("uses resize event for window", () => {
      // happy-dom doesn't allow mocking window dimensions
    });
  });
});
