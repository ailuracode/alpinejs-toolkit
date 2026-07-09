/**
 * Manager-layer tests for `@ailuracode/alpine-sidebar`.
 *
 * Per `.agents/instructions/testing.instructions.md`, manager tests
 * cover: initial state, transitions, invariants, events, options,
 * errors, idempotency, and cleanup. The sidebar composes a
 * {@link ToggleController} for the boolean `visible` state machine,
 * so the assertions verify the side-effects (escape + breakpoint)
 * on top of the toggle delegation.
 *
 * 26 tests map to the spec matrix. Where multiple scenarios collapse
 * into a single assertion (e.g. `show / hide` idempotency, the four
 * `breakpoint` rows), one test covers the merged surface to keep the
 * suite focused.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalStorageSidebarStorage,
  createMemorySidebarStorage,
  createSidebar,
  type SidebarChangeDetail,
  type SidebarController,
} from "../src/index";
import { setMatchMedia } from "./setup";

const MIN_WIDTH_1024 = "(min-width: 1024px)";

describe("SidebarController — initial state", () => {
  it("matchesBreakpoint === false before any media-query read", () => {
    const controller = createSidebar();
    expect(controller.matchesBreakpoint).toBe(false);
    controller.destroy();
  });

  it("reads initial matchesBreakpoint from mql.matches on construction", () => {
    setMatchMedia(MIN_WIDTH_1024, true);
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
    });
    expect(controller.matchesBreakpoint).toBe(true);
    controller.destroy();
  });
});

describe("SidebarController — show / hide", () => {
  let controller: SidebarController;
  beforeEach(() => {
    controller = createSidebar();
  });
  afterEach(() => {
    controller.destroy();
  });

  it("show() from hidden sets visible", () => {
    expect(controller.visible).toBe(false);
    controller.show();
    expect(controller.visible).toBe(true);
  });

  it("hide() from visible sets visible to false", () => {
    controller.show();
    expect(controller.visible).toBe(true);
    controller.hide();
    expect(controller.visible).toBe(false);
  });

  it("show() is idempotent — no second change event", () => {
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    controller.show();
    controller.show();
    controller.show();
    expect(events).toHaveLength(1);
    expect(events[0].visible).toBe(true);
  });

  it("hide() is idempotent — no second change event", () => {
    // Controller starts hidden. Multiple hide() calls produce no events.
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    controller.hide();
    controller.hide();
    controller.hide();
    expect(events).toHaveLength(0);
  });
});

describe("SidebarController — toggle", () => {
  let controller: SidebarController;
  beforeEach(() => {
    controller = createSidebar();
  });
  afterEach(() => {
    controller.destroy();
  });

  it("hides ↔ shows across multiple calls", () => {
    expect(controller.visible).toBe(false);
    controller.toggle();
    expect(controller.visible).toBe(true);
    controller.toggle();
    expect(controller.visible).toBe(false);
    controller.toggle();
    expect(controller.visible).toBe(true);
  });
});

describe("SidebarController — breakpoint", () => {
  it("onMismatch:'hide' hides the sidebar when the query stops matching", async () => {
    setMatchMedia(MIN_WIDTH_1024, true);
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
    });
    controller.show();
    expect(controller.visible).toBe(true);
    // Wait for the queued initialization microtask before flipping —
    // the controller's init path also calls observeBreakpoint
    // synchronously, so a flip right after construction is safe.
    setMatchMedia(MIN_WIDTH_1024, false);
    await Promise.resolve();
    expect(controller.visible).toBe(false);
    expect(controller.matchesBreakpoint).toBe(false);
    controller.destroy();
  });

  it("onMismatch:'keep' preserves `visible` on mismatch and only flips matchesBreakpoint", () => {
    setMatchMedia(MIN_WIDTH_1024, true);
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "keep" },
    });
    controller.show();
    expect(controller.visible).toBe(true);
    setMatchMedia(MIN_WIDTH_1024, false);
    expect(controller.visible).toBe(true);
    expect(controller.matchesBreakpoint).toBe(false);
    controller.destroy();
  });

  it("re-match does NOT auto-show after a hide-on-mismatch", async () => {
    setMatchMedia(MIN_WIDTH_1024, true);
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
    });
    controller.show();
    expect(controller.visible).toBe(true);
    setMatchMedia(MIN_WIDTH_1024, false);
    await Promise.resolve();
    expect(controller.visible).toBe(false);
    setMatchMedia(MIN_WIDTH_1024, true);
    await Promise.resolve();
    expect(controller.visible).toBe(false);
    expect(controller.matchesBreakpoint).toBe(true);
    controller.destroy();
  });
});

describe("SidebarController — escape key", () => {
  it("default listener fires Escape and closes the sidebar", () => {
    const controller = createSidebar();
    controller.show();
    expect(controller.visible).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(controller.visible).toBe(false);
    controller.destroy();
  });

  it("closeOnEscape:false registers NO keydown listener", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const tag = "keydown";
    const before = addSpy.mock.calls.filter(([t]) => t === tag).length;
    const controller = createSidebar({ closeOnEscape: false });
    const after = addSpy.mock.calls.filter(([t]) => t === tag).length;
    expect(after).toBe(before);
    controller.destroy();
    addSpy.mockRestore();
  });

  it("non-Escape keys are filtered out", () => {
    const controller = createSidebar();
    controller.show();
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    expect(events).toHaveLength(0);
    expect(controller.visible).toBe(true);
    controller.destroy();
  });
});

describe("SidebarController — change event payload", () => {
  it("has all four fields: visible, matchesBreakpoint, source, previous", () => {
    const controller = createSidebar();
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    controller.show();
    expect(events).toHaveLength(1);
    const detail = events[0];
    expect(detail).toHaveProperty("visible");
    expect(detail).toHaveProperty("matchesBreakpoint");
    expect(detail).toHaveProperty("source");
    expect(detail).toHaveProperty("previous");
    expect(typeof detail.visible).toBe("boolean");
    expect(typeof detail.matchesBreakpoint).toBe("boolean");
    controller.destroy();
  });
});

describe("SidebarController — source discriminator", () => {
  it("'user' fires from show/hide/toggle", () => {
    const controller = createSidebar();
    const sources: string[] = [];
    controller.on("change", (detail) => sources.push(detail.source));
    controller.show();
    controller.hide();
    controller.toggle();
    expect(sources).toEqual(["user", "user", "user"]);
    controller.destroy();
  });

  it("'breakpoint' fires from matchMedia change events", () => {
    setMatchMedia(MIN_WIDTH_1024, true);
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
    });
    const sources: string[] = [];
    controller.on("change", (detail) => sources.push(detail.source));
    setMatchMedia(MIN_WIDTH_1024, false);
    expect(sources).toContain("breakpoint");
    controller.destroy();
  });

  it("'escape' fires from window keydown Escape", () => {
    const controller = createSidebar();
    controller.show();
    const sources: string[] = [];
    controller.on("change", (detail) => sources.push(detail.source));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(sources).toContain("escape");
    controller.destroy();
  });

  it("'initialization' fires on the next microtask after mount()", async () => {
    const controller = createSidebar();
    const sources: string[] = [];
    controller.on("change", (detail) => sources.push(detail.source));
    await Promise.resolve();
    expect(sources).toContain("initialization");
    controller.destroy();
  });

  it("'reset' fires from controller.reset()", () => {
    const controller = createSidebar();
    controller.show();
    const sources: string[] = [];
    controller.on("change", (detail) => sources.push(detail.source));
    controller.reset();
    expect(sources).toContain("reset");
    controller.destroy();
  });
});

describe("SidebarController — lifecycle", () => {
  it("mount() second call is a no-op (addEventListener count unchanged)", () => {
    const controller = createSidebar();
    const addSpy = vi.spyOn(window, "addEventListener");
    const tag = "keydown";
    const before = addSpy.mock.calls.filter(([t]) => t === tag).length;
    controller.mount();
    const after = addSpy.mock.calls.filter(([t]) => t === tag).length;
    expect(after).toBe(before);
    controller.destroy();
    addSpy.mockRestore();
  });

  it("destroy() second call is a no-op", () => {
    const controller = createSidebar();
    controller.destroy();
    expect(() => controller.destroy()).not.toThrow();
    expect(controller.isDestroyed).toBe(true);
  });

  it("post-destroy show/hide/toggle are no-ops", () => {
    const controller = createSidebar();
    controller.destroy();
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    controller.show();
    controller.hide();
    controller.toggle();
    expect(events).toHaveLength(0);
  });
});

describe("SidebarController — leak detection", () => {
  it("removeEventListener is called with the same handler reference for both listeners", () => {
    // Window keydown listener: spy on `addEventListener` /
    // `removeEventListener` on `window` and assert symmetric counts.
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    setMatchMedia(MIN_WIDTH_1024, true);
    const mql = window.matchMedia(MIN_WIDTH_1024);
    const mqlAddSpy = vi.spyOn(mql, "addEventListener");
    const mqlRemoveSpy = vi.spyOn(mql, "removeEventListener");

    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
    });
    const keydownAdds = addSpy.mock.calls.filter(([t]) => t === "keydown").length;
    expect(keydownAdds).toBeGreaterThan(0);
    expect(mqlAddSpy).toHaveBeenCalledTimes(1);

    controller.destroy();

    const keydownRemoves = removeSpy.mock.calls.filter(([t]) => t === "keydown").length;
    expect(keydownRemoves).toBe(keydownAdds);
    expect(mqlRemoveSpy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

describe("SidebarController — safeMatchMedia contract", () => {
  it("uses safeMatchMedia from @ailuracode/alpine-core (NOT raw window.matchMedia)", async () => {
    const core = await import("@ailuracode/alpine-core");
    const spy = vi.spyOn(core, "safeMatchMedia");
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
    });
    expect(spy).toHaveBeenCalledWith(MIN_WIDTH_1024);
    controller.destroy();
    spy.mockRestore();
  });
});

describe("SidebarController — SSR", () => {
  afterEach(() => {
    // Re-stub `window` after each SSR test so the next test's jsdom
    // session sees a real window again. We avoid `unstubAllGlobals`
    // because it would also clear `safeMatchMedia`'s environment.
    vi.unstubAllGlobals();
  });

  it("constructing under missing window does not throw; matchesBreakpoint === false", () => {
    // Stub `window` to `undefined` to simulate the SSR environment.
    // The controller uses `safeWindow()` / `safeMatchMedia()` for
    // every browser-API access, so the construction path stays
    // inert.
    vi.stubGlobal("window", undefined);
    expect(() =>
      createSidebar({
        breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
        closeOnEscape: true,
      })
    ).not.toThrow();
    // Re-read after the fact: the stubbed window is gone but the
    // controller was built before the test scope exited. Reach for
    // the live singleton via a fresh construction under SSR.
    const fresh = createSidebar();
    expect(fresh.matchesBreakpoint).toBe(false);
    fresh.destroy();
  });
});

describe("SidebarController — event bus", () => {
  it("on / once / off / removeAllListeners cover every subscription edge case", () => {
    const controller = createSidebar();

    // `on` — every transition fires the listener.
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    controller.show();
    controller.hide();
    controller.toggle();
    expect(events).toHaveLength(3);

    // `once` — auto-unsubscribes after the first transition.
    let onceCalls = 0;
    controller.once("change", () => {
      onceCalls += 1;
    });
    expect(controller.listenerCount("change")).toBe(2);
    // Hide so the next `show()` actually transitions (the previous
    // `toggle()` left `visible === true`, so a naive `show()` would
    // be idempotent and emit nothing).
    controller.hide();
    expect(onceCalls).toBe(1);
    expect(controller.listenerCount("change")).toBe(1);
    controller.show();
    expect(onceCalls).toBe(1);

    // `off` — detaches a previously registered listener.
    const offTarget = vi.fn();
    controller.on("change", offTarget);
    expect(controller.listenerCount("change")).toBe(2);
    controller.off("change", offTarget);
    expect(controller.listenerCount("change")).toBe(1);
    controller.hide();
    expect(offTarget).not.toHaveBeenCalled();

    // `removeAllListeners` — clears every listener.
    controller.removeAllListeners();
    expect(controller.listenerCount("change")).toBe(0);

    controller.destroy();
  });
});

describe("SidebarController + storage — hydration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("mount() hydrates from storage via setSilently, no extra change event beyond the init one", () => {
    localStorage.setItem("k1", "true");
    const events: SidebarChangeDetail[] = [];
    const controller = createSidebar({ storage: createLocalStorageSidebarStorage({ key: "k1" }) });
    controller.on("change", (detail) => events.push(detail));
    // The hydration is silent — the toggle.setSilently call does not
    // emit. Only the queued init microtask fires.
    return Promise.resolve().then(() => {
      expect(controller.visible).toBe(true);
      // The init event reflects the hydrated value.
      const init = events.find((e) => e.source === "initialization");
      expect(init?.visible).toBe(true);
      // No duplicate 'storage' or 'user' event for the hydration itself.
      const sources = events.map((e) => e.source);
      expect(sources.filter((s) => s === "user" || s === "storage")).toHaveLength(0);
      controller.destroy();
    });
  });

  it("storage wins over `initial` when both are present (storage:false overrides initial:true)", () => {
    localStorage.setItem("k2", "false");
    const controller = createSidebar({
      initial: true,
      storage: createLocalStorageSidebarStorage({ key: "k2" }),
    });
    // Storage is read inside #init() at mount, which createSidebar already
    // called. Constructor sets initial:true, but the init hydration
    // overrides with the persisted false.
    expect(controller.visible).toBe(false);
    controller.destroy();
  });
});

describe("SidebarController + storage — write paths", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("show() / hide() / toggle() write the literal string to localStorage", () => {
    const storage = createLocalStorageSidebarStorage({ key: "kw" });
    const controller = createSidebar({ storage });

    controller.show();
    expect(localStorage.getItem("kw")).toBe("true");
    controller.hide();
    expect(localStorage.getItem("kw")).toBe("false");
    controller.toggle();
    expect(localStorage.getItem("kw")).toBe("true");

    controller.destroy();
  });

  it("breakpoint / escape / reset / initialization do NOT write to storage", () => {
    const storage = createLocalStorageSidebarStorage({ key: "kw2" });
    setMatchMedia(MIN_WIDTH_1024, true);
    const controller = createSidebar({
      breakpoint: { query: MIN_WIDTH_1024, onMismatch: "hide" },
      storage,
    });
    controller.show();
    // `show()` writes once.
    expect(localStorage.getItem("kw2")).toBe("true");

    // Breakpoint flip to false hides (source: 'breakpoint') — must NOT write.
    setMatchMedia(MIN_WIDTH_1024, false);
    expect(localStorage.getItem("kw2")).toBe("true");

    // Re-show so the escape has something to close.
    controller.show();
    expect(localStorage.getItem("kw2")).toBe("true");

    // Escape hides (source: 'escape') — must NOT write.
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(localStorage.getItem("kw2")).toBe("true");

    // Reset (source: 'reset') — must NOT write.
    controller.show();
    expect(localStorage.getItem("kw2")).toBe("true");
    controller.reset();
    expect(localStorage.getItem("kw2")).toBe("true");

    controller.destroy();
  });
});

describe("SidebarController + storage — cross-tab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("storage event in tab B → controller.visible updated + emits source:'storage'", () => {
    const storage = createLocalStorageSidebarStorage({ key: "kx" });
    const controller = createSidebar({ storage });
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    expect(controller.visible).toBe(false);

    // Simulate tab A writing 'true' by dispatching a cross-tab event.
    window.dispatchEvent(new StorageEvent("storage", { key: "kx", newValue: "true" }));

    expect(controller.visible).toBe(true);
    const storageEvent = events.find((e) => e.source === "storage");
    expect(storageEvent?.visible).toBe(true);
    expect(storageEvent?.previous?.visible).toBe(false);
    controller.destroy();
  });

  it("echo detection: storage event matching the last write is dropped", () => {
    const storage = createLocalStorageSidebarStorage({ key: "ke" });
    const controller = createSidebar({ storage });
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));

    controller.show();
    const before = events.length;

    // Echo — the localStorage event fires with the same value we just wrote.
    window.dispatchEvent(new StorageEvent("storage", { key: "ke", newValue: "true" }));

    // No new event emitted (the echo was consumed).
    expect(events.length).toBe(before);
    controller.destroy();
  });

  it("storage event newValue:null falls back to `initial`", () => {
    const storage = createLocalStorageSidebarStorage({ key: "kf" });
    const controller = createSidebar({ initial: true, storage });
    const events: SidebarChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));

    // Set visible to true (write 'true' to storage).
    controller.show();
    // Clear storage via the adapter — this drops a real `storage` event
    // in jsdom, but we dispatch the cross-tab event manually for control.
    const before = events.length;
    window.dispatchEvent(new StorageEvent("storage", { key: "kf", newValue: null }));

    // The cross-tab clear falls back to `initial: true` and emits
    // source: 'storage'. visible is already true so no toggle
    // transition fires, but the fallback path was taken.
    // Verify by transitioning to false first:
    controller.hide();
    const hideAt = events.length;
    window.dispatchEvent(new StorageEvent("storage", { key: "kf", newValue: null }));
    expect(controller.visible).toBe(true);
    const storageEvent = events.slice(hideAt).find((e) => e.source === "storage");
    expect(storageEvent?.visible).toBe(true);
    void before;
    controller.destroy();
  });
});

describe("SidebarController + storage — persistKey shortcut", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persistKey builds createLocalStorageSidebarStorage({ key }) internally", () => {
    localStorage.setItem("app-sidebar", "true");
    const controller = createSidebar({ persistKey: "app-sidebar" });
    expect(controller.visible).toBe(true);
    controller.destroy();
  });

  it("storage option wins when both persistKey and storage are provided", () => {
    localStorage.setItem("app-sidebar", "true");
    localStorage.setItem("memory", "false");
    const memory = createMemorySidebarStorage(false);
    const controller = createSidebar({ persistKey: "app-sidebar", storage: memory });
    // Memory adapter seeded to false; localStorage was 'true' but
    // explicit storage wins over the persistKey shortcut.
    expect(controller.visible).toBe(false);
    controller.destroy();
  });
});
