import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPanelPreferences,
  DEFAULT_PREFERENCES_STORAGE_KEY,
  loadPanelPreferences,
  savePanelPreferences,
} from "../src/devtools/panel-preferences.js";

describe("query devtools panel preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads defaults when storage is empty", () => {
    expect(loadPanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY)).toEqual(createPanelPreferences());
  });

  it("round-trips saved preferences", () => {
    savePanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY, {
      selectedAdapterId: "nanostores",
      querySort: "key-asc",
      mutationSort: "status",
      search: "pokemon",
      activeTab: "mutations",
      followLatest: true,
      mobilePanelHeight: 520,
      isOpen: true,
      rememberOpenState: true,
    });

    expect(loadPanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY)).toEqual({
      selectedAdapterId: "nanostores",
      querySort: "key-asc",
      mutationSort: "status",
      search: "pokemon",
      activeTab: "mutations",
      followLatest: true,
      mobilePanelHeight: 520,
      isOpen: true,
      rememberOpenState: true,
    });
  });

  it("falls back to defaults for invalid stored values", () => {
    localStorage.setItem(DEFAULT_PREFERENCES_STORAGE_KEY, JSON.stringify({ querySort: "nope" }));

    expect(loadPanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY, { filter: "seed" })).toEqual(
      createPanelPreferences({ filter: "seed" })
    );
  });

  it("falls back to defaults when localStorage is undefined", () => {
    const original = globalThis.localStorage;
    (globalThis as Record<string, unknown>).localStorage = undefined;
    expect(loadPanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY, { filter: "seed" })).toEqual(
      createPanelPreferences({ filter: "seed" })
    );
    savePanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY, createPanelPreferences());
    globalThis.localStorage = original;
  });

  it("handles localStorage throwing on get", () => {
    const original = localStorage.getItem;
    localStorage.getItem = vi.fn(() => {
      throw new Error("quota");
    }) as typeof original;
    expect(loadPanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY, { filter: "seed" })).toEqual(
      createPanelPreferences({ filter: "seed" })
    );
    localStorage.getItem = original;
  });

  it("handles localStorage throwing on set", () => {
    const original = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error("quota");
    }) as typeof original;
    savePanelPreferences(DEFAULT_PREFERENCES_STORAGE_KEY, createPanelPreferences());
    localStorage.setItem = original;
  });
});
