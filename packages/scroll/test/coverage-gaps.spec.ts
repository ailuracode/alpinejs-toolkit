/**
 * Coverage-gaps spec — drives defensive branches and event
 * subscriptions to meet R13 thresholds (lines ≥90%, stmts ≥90%,
 * branches ≥85%, funcs ≥90%).
 *
 * Per `.cursor/rules/testing.mdc`, alongside-changes
 * tests (not strict TDD) — every gap-fill test pairs with the
 * surface it covers, no red-green-refactor cycle.
 */

import { describe, expect, it, vi } from "vitest";
import { ScrollController } from "../src/controller";
import { scrollPlugin } from "../src/index";
import type { ScrollChangeDetail, ScrollSectionChangeDetail } from "../src/types";

describe("coverage-gaps — scroll observer", () => {
  it("fires reach:top when scrolling back to top", async () => {
    const controller = new ScrollController();
    controller.mount();
    const reachEvents: Array<{ edge: string; y: number }> = [];
    controller.on("reach", (d) => reachEvents.push(d));
    Object.defineProperty(window, "scrollY", { configurable: true, value: 200 });
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 30));
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => setTimeout(r, 30));
    expect(reachEvents.find((e) => e.edge === "top")).toBeDefined();
    controller.destroy();
  });
});

describe("coverage-gaps — section observer", () => {
  it("registerSection + unregisterSection exercise the full path", () => {
    const controller = new ScrollController();
    controller.mount();
    const sectionEvents: ScrollSectionChangeDetail[] = [];
    controller.on("section", (d) => sectionEvents.push(d));
    const el = document.createElement("section");
    el.id = "test-section";
    document.body.appendChild(el);
    controller.registerSection("test-section");
    controller.unregisterSection("test-section");
    el.remove();
    expect(controller.visibleSections.length).toBe(0);
    controller.destroy();
  });
});

describe("coverage-gaps — navigation branches", () => {
  it("scrollIntoView with focus option calls .focus()", () => {
    const controller = new ScrollController();
    controller.mount();
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, "focus");
    controller.scrollIntoView(el, { focus: true });
    expect(focusSpy).toHaveBeenCalled();
    controller.destroy();
    el.remove();
  });

  it("scrollIntoView without focus option skips .focus()", () => {
    const controller = new ScrollController();
    controller.mount();
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = vi.spyOn(el, "focus");
    controller.scrollIntoView(el);
    expect(focusSpy).not.toHaveBeenCalled();
    controller.destroy();
    el.remove();
  });
});

describe("coverage-gaps — plugin factory", () => {
  it("scrollPlugin() registers the store and the magic when invoked", () => {
    const alpine = {
      stores: {} as Record<string, unknown>,
      magics: {} as Record<string, () => unknown>,
      cleanups: [] as Array<() => void>,
      store: (name: string, value?: unknown): unknown => {
        if (value === undefined) {
          return alpine.stores[name];
        }
        alpine.stores[name] = value;
        return undefined;
      },
      magic: (name: string, factory: () => unknown): void => {
        alpine.magics[name] = factory;
      },
      cleanup: (cb: () => void): void => {
        alpine.cleanups.push(cb);
      },
    };
    scrollPlugin()(alpine as unknown as import("alpinejs").Alpine);
    expect(alpine.stores.scroll).toBeDefined();
    expect(alpine.magics.scroll).toBeDefined();
    expect(alpine.cleanups.length).toBe(1);
  });
});

describe("coverage-gaps — controller getter paths", () => {
  it("lockHandles getter returns the live handles list", () => {
    const controller = new ScrollController();
    controller.mount();
    const h1 = controller.lockWithHandle("modal");
    const h2 = controller.lockWithHandle("menu");
    expect(controller.lockHandles.length).toBe(2);
    expect(controller.lockHandles).toContain(h1);
    expect(controller.lockHandles).toContain(h2);
    controller.destroy();
  });
});

describe("coverage-gaps — destroy paths", () => {
  it("controller.destroy() is safe to call twice", () => {
    const controller = new ScrollController();
    controller.mount();
    controller.destroy();
    expect(() => controller.destroy()).not.toThrow();
  });
});

describe("coverage-gaps — error code propagation", () => {
  it("ScrollError surfaces SCROLL_LOCK_INVALID_REASON", () => {
    const controller = new ScrollController();
    controller.mount();
    expect(() => {
      // @ts-expect-error – intentionally bad input
      controller.lockWithHandle(42);
    }).toThrowError(expect.objectContaining({ code: "SCROLL_LOCK_INVALID_REASON" }));
    controller.destroy();
  });

  it("ScrollError surfaces SCROLL_LOCK_HANDLE_NOT_FOUND", () => {
    const controller = new ScrollController();
    controller.mount();
    expect(() => controller.unlock("nope")).toThrowError(
      expect.objectContaining({ code: "SCROLL_LOCK_HANDLE_NOT_FOUND" })
    );
    controller.destroy();
  });
});

describe("coverage-gaps — change event propagation", () => {
  it("every controller command emits a change event", async () => {
    const controller = new ScrollController();
    controller.mount();
    const events: ScrollChangeDetail[] = [];
    controller.on("change", (d) => events.push(d));
    controller.lockWithHandle("modal");
    await Promise.resolve();
    expect(events.find((e) => e.source === "lock")).toBeDefined();
    controller.toTop("user");
    expect(events.find((e) => e.source === "navigation")).toBeDefined();
    controller.destroy();
  });

  it("reset() emits a change event with source 'reset'", async () => {
    const controller = new ScrollController();
    controller.mount();
    const events: ScrollChangeDetail[] = [];
    controller.on("change", (d) => events.push(d));
    controller.reset();
    await Promise.resolve();
    expect(events.find((e) => e.source === "reset")).toBeDefined();
    controller.destroy();
  });
});
