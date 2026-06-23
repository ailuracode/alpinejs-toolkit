import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  isToggleCorner,
  loadToggleCorner,
  saveToggleCorner,
} from "../src/toggle-corner.js";

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
});
