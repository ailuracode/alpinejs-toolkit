import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import tooltipPlugin, { createTooltipStore } from "../src/index.js";

describe("@ailuracode/alpine-tooltip", () => {
  let store: ReturnType<typeof createTooltipStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createTooltipStore();
    store.register("help", { openDelay: 100, closeDelay: 50 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens and closes with delays", () => {
    store.open("help");
    expect(store.isOpen("help")).toBe(false);

    vi.advanceTimersByTime(100);
    expect(store.isOpen("help")).toBe(true);

    store.close("help");
    vi.advanceTimersByTime(50);
    expect(store.isOpen("help")).toBe(false);
  });

  it("dismisses on Escape", () => {
    store.register("help", { openDelay: 0 });
    store.open("help");

    store.handleKeydown("help", new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.isOpen("help")).toBe(false);
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(tooltipPlugin());
    const tooltip = Alpine.store("tooltip") as ReturnType<typeof createTooltipStore>;

    tooltip.register("demo");
    tooltip.open("demo");
    expect(tooltip.isOpen("demo")).toBe(true);
  });
});
