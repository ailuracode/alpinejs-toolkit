import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import type { TooltipController } from "../src/index.js";
import tooltipPlugin, { createTooltipController, createTooltipStore } from "../src/index.js";

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

describe("TooltipController cleanup lifecycle", () => {
  let controller: TooltipController;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("disposes cleanup when a delayed open timer fires", () => {
    controller = createTooltipController();
    controller.register("a", { openDelay: 100 });
    controller.open("a");

    expect(controller.instanceCleanupCount).toBe(1);

    vi.advanceTimersByTime(100);

    expect(controller.instanceCleanupCount).toBe(0);
    expect(controller.isOpen("a")).toBe(true);
  });

  it("disposes cleanup when a delayed close timer fires", () => {
    controller = createTooltipController();
    controller.register("a", { closeDelay: 50 });
    controller.open("a");
    expect(controller.isOpen("a")).toBe(true);

    controller.close("a");
    expect(controller.instanceCleanupCount).toBe(1);

    vi.advanceTimersByTime(50);

    expect(controller.instanceCleanupCount).toBe(0);
    expect(controller.isOpen("a")).toBe(false);
  });

  it("replaces previous cleanup when scheduling a new delayed open", () => {
    controller = createTooltipController();
    controller.register("a", { openDelay: 200 });
    controller.open("a");
    expect(controller.instanceCleanupCount).toBe(1);

    controller.close("a");
    controller.open("a");
    expect(controller.instanceCleanupCount).toBe(1);
  });

  it("replaces previous cleanup when scheduling a new delayed close", () => {
    controller = createTooltipController();
    controller.register("a", { closeDelay: 200 });
    controller.open("a");
    controller.close("a");
    expect(controller.instanceCleanupCount).toBe(1);

    controller.open("a");
    controller.close("a");
    expect(controller.instanceCleanupCount).toBe(1);
  });

  it("unregister() releases all resources for that instance", () => {
    controller = createTooltipController();
    controller.register("a", { openDelay: 100, closeDelay: 100 });
    controller.open("a");

    expect(controller.instanceCleanupCount).toBe(1);

    controller.unregister("a");

    expect(controller.instanceCleanupCount).toBe(0);
    expect(controller.hasInstance("a")).toBe(false);
  });

  it("destroy() clears all pending timers and cleanups", () => {
    controller = createTooltipController();
    controller.register("a", { openDelay: 100 });
    controller.register("b", { closeDelay: 100 });
    controller.open("a");
    controller.open("b");
    controller.close("b");

    expect(controller.instanceCleanupCount).toBe(2);

    controller.destroy();

    expect(controller.instanceCleanupCount).toBe(0);
  });

  it("destroy() is idempotent", () => {
    controller = createTooltipController();
    controller.register("a", { openDelay: 100 });
    controller.open("a");

    controller.destroy();
    controller.destroy();

    expect(controller.instanceCleanupCount).toBe(0);
  });

  it("cleanup remains bounded after repeated delayed open/close cycles", () => {
    controller = createTooltipController();
    controller.register("a", { openDelay: 50, closeDelay: 50 });

    for (let i = 0; i < 100; i++) {
      controller.open("a");
      vi.advanceTimersByTime(50);
      controller.close("a");
      vi.advanceTimersByTime(50);
    }

    expect(controller.instanceCleanupCount).toBe(0);
  });

  it("delayed callback cannot mutate an unregistered instance", () => {
    controller = createTooltipController();
    const onClose = vi.fn();
    controller.register("a", { closeDelay: 100, onClose });
    controller.open("a");
    controller.close("a");

    controller.unregister("a");
    vi.advanceTimersByTime(100);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("delayed callback cannot mutate a destroyed controller", () => {
    controller = createTooltipController();
    const onOpen = vi.fn();
    controller.register("a", { openDelay: 100, onOpen });
    controller.open("a");

    controller.destroy();
    vi.advanceTimersByTime(100);

    expect(onOpen).not.toHaveBeenCalled();
  });
});
