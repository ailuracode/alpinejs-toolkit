import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  isToggleCorner,
  loadToggleCorner,
  saveToggleCorner,
} from "../src/devtools/toggle-corner.js";

describe("toggle-corner", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("validates toggle corners", () => {
    expect(isToggleCorner("top-left")).toBe(true);
    expect(isToggleCorner("bottom-right")).toBe(true);
    expect(isToggleCorner("center")).toBe(false);
  });

  it("loads and saves the toggle corner", () => {
    saveToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "top-right");
    expect(loadToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "bottom-left")).toBe("top-right");
  });

  it("falls back when storage is empty or invalid", () => {
    expect(loadToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "top-left")).toBe("top-left");
    localStorage.setItem(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "invalid");
    expect(loadToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "bottom-left")).toBe("bottom-left");
  });

  it("falls back when localStorage is undefined", () => {
    const original = globalThis.localStorage;
    (globalThis as Record<string, unknown>).localStorage = undefined;
    expect(loadToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "top-left")).toBe("top-left");
    saveToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "top-right");
    globalThis.localStorage = original;
  });

  it("handles localStorage throwing on get", () => {
    const original = localStorage.getItem;
    localStorage.getItem = vi.fn(() => {
      throw new Error("quota");
    }) as typeof original;
    expect(loadToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "bottom-left")).toBe("bottom-left");
    localStorage.getItem = original;
  });

  it("handles localStorage throwing on set", () => {
    localStorage.clear();
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => {
      saveToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "top-right");
    }).not.toThrow();
    expect(setItem).toHaveBeenCalledWith(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "top-right");
    expect(loadToggleCorner(DEFAULT_TOGGLE_CORNER_STORAGE_KEY, "bottom-left")).toBe("bottom-left");
    setItem.mockRestore();
  });
});
