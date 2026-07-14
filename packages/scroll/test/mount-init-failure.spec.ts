/**
 * Mount init-failure spec — verifies transactional initialization:
 * unexpected setup errors surface, partial listeners are rolled back,
 * and the initialization change event is not emitted on failure.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollController } from "../src/controller";
import { LockManager } from "../src/internal/lock-manager";
import * as scrollObserver from "../src/internal/scroll-observer";
import * as sectionObserver from "../src/internal/section-observer";
import type { ScrollChangeDetail } from "../src/types";

describe("ScrollController — mount init failures", () => {
  let controller: ScrollController;

  beforeEach(() => {
    controller = new ScrollController();
  });

  afterEach(() => {
    if (!controller.isDestroyed) {
      controller.destroy();
    }
    vi.restoreAllMocks();
  });

  it("re-throws scroll observer setup errors and leaves the controller destroyed", () => {
    const setupError = new Error("scroll observer setup failed");
    vi.spyOn(scrollObserver, "attachScrollObserver").mockImplementation(() => {
      throw setupError;
    });

    expect(() => controller.mount()).toThrow(setupError);
    expect(controller.isDestroyed).toBe(true);
    expect(controller.isMounted).toBe(false);
  });

  it("rolls back pending init cleanups when a later init step fails", () => {
    const scrollCleanup = vi.fn();
    vi.spyOn(scrollObserver, "attachScrollObserver").mockReturnValue(scrollCleanup);
    vi.spyOn(LockManager.prototype, "onChange").mockImplementation(() => {
      throw new Error("lock wiring failed");
    });

    expect(() => controller.mount()).toThrow("lock wiring failed");
    expect(scrollCleanup).toHaveBeenCalledOnce();
    expect(controller.isDestroyed).toBe(true);
  });

  it("surfaces section observer setup errors from registerSection", () => {
    controller.mount();

    const section = document.createElement("section");
    section.id = "hero";
    document.body.append(section);

    vi.spyOn(sectionObserver, "attachSectionObserver").mockImplementation(() => {
      throw new Error("section observer setup failed");
    });

    expect(() => controller.registerSection("hero")).toThrow("section observer setup failed");
    expect(controller.isMounted).toBe(true);

    section.remove();
  });

  it("does not emit an initialization change event when setup fails", async () => {
    vi.spyOn(scrollObserver, "attachScrollObserver").mockImplementation(() => {
      throw new Error("scroll observer setup failed");
    });

    const events: ScrollChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));

    expect(() => controller.mount()).toThrow();
    await Promise.resolve();

    expect(events.find((event) => event.source === "initialization")).toBeUndefined();
  });

  it("post-failure commands throw because the controller was destroyed", () => {
    vi.spyOn(scrollObserver, "attachScrollObserver").mockImplementation(() => {
      throw new Error("scroll observer setup failed");
    });

    expect(() => controller.mount()).toThrow();
    expect(() => controller.lockWithHandle("modal")).toThrow();
    expect(() => controller.toTop()).toThrow();
  });
});
