/**
 * Criticals-fix spec — pins 1:1 to the 12 criticals from the v1.0.0
 * review synthesis (`scroll/review-synthesis-v1.0.0`).
 *
 * Each `describe` block names the critical; each `it` block pins a
 * single assertion. New criticals discovered in this round append
 * to the end of the file (do not renumber).
 */

import { ToolkitError } from "@ailuracode/alpine-core/controller";
import type { Alpine as AlpineBase } from "alpinejs";
import { describe, expect, it, vi } from "vitest";
import { ScrollController } from "../src/controller";
import { scrollPlugin } from "../src/index";
import * as scrollObserver from "../src/internal/scroll-observer";
import type { ScrollChangeDetail, ScrollLockChangeDetail } from "../src/types";

describe("Critical #1 — #assertAlive throws ToolkitError('CONTROLLER_DESTROYED')", () => {
  it("lockWithHandle on destroyed controller throws ToolkitError", () => {
    const controller = new ScrollController();
    controller.mount();
    controller.destroy();
    expect(() => controller.lockWithHandle("modal")).toThrow(ToolkitError);
    expect(() => controller.lockWithHandle("modal")).toThrowError(
      expect.objectContaining({ code: "CONTROLLER_DESTROYED" })
    );
  });
});

describe("Critical #2 — mount() transactional initialization", () => {
  it("unexpected init failures re-throw and transition the controller to destroyed", () => {
    const controller = new ScrollController();
    const setupError = new Error("scroll observer setup failed");
    vi.spyOn(scrollObserver, "attachScrollObserver").mockImplementation(() => {
      throw setupError;
    });

    expect(() => controller.mount()).toThrow(setupError);
    expect(controller.isMounted).toBe(false);
    expect(controller.isDestroyed).toBe(true);

    vi.restoreAllMocks();
  });
});

describe("Critical #3 — scrollPlugin factory subscribes once to controller.on('change')", () => {
  it("the closure subscribes once and registers exactly one Alpine.cleanup callback", () => {
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
    scrollPlugin({ id: "critical-3" })(alpine as unknown as AlpineBase);
    expect(alpine.cleanups.length).toBe(1);
    // The cleanup callback unsubscribes the `change` listener and
    // destroys the controller. Both operations are idempotent —
    // firing the callback twice must NOT throw. This pins the
    // v1.0.0 lifecycle contract after the v0.x class-based
    // `plugin.register()` idempotency guard was retired in favour
    // of the factory pattern shared with `@ailuracode/alpine-theme`
    // and `@ailuracode/alpine-sidebar`.
    expect(() => alpine.cleanups[0]()).not.toThrow();
    expect(() => alpine.cleanups[0]()).not.toThrow();
  });

  it("re-invoking scrollPlugin() creates a fresh subscription and a second cleanup", () => {
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
    scrollPlugin()(alpine as unknown as AlpineBase);
    expect(alpine.cleanups.length).toBe(1);
    scrollPlugin()(alpine as unknown as AlpineBase);
    // A second factory invocation registers a SECOND cleanup, not
    // a no-op. The factory contract is single-invocation per
    // `Alpine.plugin()` call — running it twice builds two
    // independent controllers (matches `themePlugin` /
    // `sidebarPlugin` semantics).
    expect(alpine.cleanups.length).toBe(2);
  });
});

describe("Critical #6 — caller reason flows through to change event", () => {
  it("change event detail.reason matches caller-supplied reason", () => {
    const controller = new ScrollController();
    controller.mount();
    const events: ScrollChangeDetail[] = [];
    controller.on("change", (d) => events.push(d));
    controller.lockWithHandle("my-reason");
    const lockEvent = events.find((e) => e.source === "lock");
    expect(lockEvent?.reason).toBe("my-reason");
    controller.destroy();
  });
});

describe("Critical #7 — ScrollLockChangeDetail canonical shape", () => {
  it("lock event detail shape includes locked, count, reason, handle", () => {
    const controller = new ScrollController();
    controller.mount();
    const events: ScrollLockChangeDetail[] = [];
    controller.on("lock", (d) => events.push(d));
    const handle = controller.lockWithHandle("modal");
    const detail = events[0];
    expect(detail.locked).toBe(true);
    expect(detail.count).toBe(1);
    expect(detail.reason).toBe("modal");
    expect(detail.handle).toBe(handle);
    expect(typeof handle).toBe("string");
    expect(handle.length).toBeGreaterThan(0);
    controller.unlock(handle);
    controller.destroy();
  });
});

describe("Critical #8 — scrollIntoView(opts) accepts { focus: false }", () => {
  it("scrollIntoView with focus:false does not call element.focus()", () => {
    const controller = new ScrollController();
    controller.mount();
    const el = document.createElement("div");
    el.tabIndex = 0;
    document.body.appendChild(el);
    const focusSpy = el.focus.bind(el);
    let called = false;
    el.focus = () => {
      called = true;
    };
    void focusSpy;
    controller.scrollIntoView(el, { focus: false });
    expect(called).toBe(false);
    controller.destroy();
    el.remove();
  });
});

describe("Critical #9 — scrollIntoView({x, y}) overload (R5)", () => {
  it("scrollIntoView with absolute coords emits navigation event", () => {
    const controller = new ScrollController();
    controller.mount();
    const events: Array<{ to: number; from: number }> = [];
    controller.on("navigation", (d) => events.push(d));
    controller.scrollIntoView({ x: 0, y: 500 });
    expect(events.length).toBe(1);
    expect(events[0].to).toBe(500);
    controller.destroy();
  });
});

describe("Critical #10 — destroy() clears --ailura-scrollbar-gap", () => {
  it("CSS variable removed on destroy", () => {
    const controller = new ScrollController({ reserveScrollbarGap: true });
    controller.mount();
    controller.lockWithHandle("modal");
    expect(document.documentElement.style.getPropertyValue("--ailura-scrollbar-gap")).not.toBe("");
    controller.destroy();
    expect(document.documentElement.style.getPropertyValue("--ailura-scrollbar-gap")).toBe("");
  });
});

describe("Critical #11 — safeNotify try/catch around listener invocations", () => {
  it("listener that throws does not crash the lock pipeline", () => {
    const controller = new ScrollController();
    controller.mount();
    let called = false;
    controller.on("lock", () => {
      called = true;
      throw new Error("listener exploded");
    });
    expect(() => controller.lockWithHandle("modal")).not.toThrow();
    expect(called).toBe(true);
    controller.destroy();
  });

  it("listener that throws does not crash the scroll observer", async () => {
    const controller = new ScrollController();
    controller.mount();
    let called = false;
    controller.on("scroll", () => {
      called = true;
      throw new Error("scroll listener exploded");
    });
    expect(() => window.dispatchEvent(new Event("scroll"))).not.toThrow();
    await new Promise((r) => setTimeout(r, 30));
    expect(called).toBe(true);
    controller.destroy();
  });
});

describe("Critical #12 — forbidOnly: true in vitest.config.ts", () => {
  it("package config has forbidOnly set to true", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const url = await import("node:url");
    const here = path.dirname(url.fileURLToPath(import.meta.url));
    const configPath = path.resolve(here, "../vitest.config.ts");
    const content = fs.readFileSync(configPath, "utf8");
    expect(content).toMatch(/forbidOnly:\s*true/);
  });
});
