/**
 * Contract spec — verifies that `ScrollController` satisfies the
 * BaseController contract (listenerCount, on/once/off semantics,
 * id propagation, destroy semantics).
 *
 * Mount and lock paths touch `document.body` styles — run under jsdom.
 */
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ScrollController } from "../src/controller";
import { isScrollErrorCode, ScrollError } from "../src/error";
import type { ScrollChangeDetail } from "../src/types";

describe("BaseController contract — ScrollController", () => {
  let controller: ScrollController;
  beforeEach(() => {
    controller = new ScrollController({ id: "contract-1" });
  });
  afterEach(() => {
    if (!controller.isDestroyed) {
      controller.destroy();
    }
  });

  it("exposes id from options", () => {
    expect(controller.id).toBe("contract-1");
  });

  it("exposes phase: 'idle' before mount()", () => {
    expect(controller.phase).toBe("idle");
  });

  it("exposes phase: 'mounted' after mount()", () => {
    controller.mount();
    expect(controller.phase).toBe("mounted");
  });

  it("exposes phase: 'destroyed' after destroy()", () => {
    controller.mount();
    controller.destroy();
    expect(controller.phase).toBe("destroyed");
  });

  it("listenerCount(event) returns 0 when no subscribers", () => {
    controller.mount();
    expect(controller.listenerCount("change")).toBe(0);
    expect(controller.listenerCount("lock")).toBe(0);
    expect(controller.listenerCount("section")).toBe(0);
    expect(controller.listenerCount("scroll")).toBe(0);
    expect(controller.listenerCount("reach")).toBe(0);
    expect(controller.listenerCount("navigation")).toBe(0);
  });

  it("listenerCount(undefined) returns total across all events", () => {
    controller.mount();
    controller.on("change", () => undefined);
    controller.on("lock", () => undefined);
    controller.on("section", () => undefined);
    expect(controller.listenerCount()).toBe(3);
  });

  it("on() returns an unsubscribe function", () => {
    controller.mount();
    const unsubscribe = controller.on("change", () => undefined);
    expect(typeof unsubscribe).toBe("function");
    expect(controller.listenerCount("change")).toBe(1);
    unsubscribe();
    expect(controller.listenerCount("change")).toBe(0);
  });

  it("off() removes a previously-attached listener", () => {
    controller.mount();
    const fn = () => undefined;
    controller.on("change", fn);
    expect(controller.listenerCount("change")).toBe(1);
    controller.off("change", fn);
    expect(controller.listenerCount("change")).toBe(0);
  });

  it("once() registers a single-shot listener", () => {
    controller.mount();
    let count = 0;
    controller.once("change", () => {
      count += 1;
    });
    expect(controller.listenerCount("change")).toBe(1);
    controller.lockWithHandle("once-test");
    expect(count).toBe(1);
    expect(controller.listenerCount("change")).toBe(0);
  });
});

describe("ScrollError — runtime guard", () => {
  it("isScrollErrorCode returns true for valid codes", () => {
    expect(isScrollErrorCode("SCROLL_NOT_BROWSER")).toBe(true);
    expect(isScrollErrorCode("SCROLL_NOT_MOUNTED")).toBe(true);
    expect(isScrollErrorCode("SCROLL_CONTROLLER_DESTROYED")).toBe(true);
    expect(isScrollErrorCode("SCROLL_LOCK_INVALID_REASON")).toBe(true);
    expect(isScrollErrorCode("SCROLL_LOCK_HANDLE_NOT_FOUND")).toBe(true);
  });

  it("isScrollErrorCode returns false for invalid values", () => {
    expect(isScrollErrorCode("BOGUS")).toBe(false);
    expect(isScrollErrorCode(42)).toBe(false);
    expect(isScrollErrorCode(null)).toBe(false);
    expect(isScrollErrorCode(undefined)).toBe(false);
    expect(isScrollErrorCode({ code: "SCROLL_NOT_BROWSER" })).toBe(false);
  });

  it("ScrollError instances carry code + name", () => {
    const error = new ScrollError("test", "SCROLL_LOCK_INVALID_REASON");
    expect(error.code).toBe("SCROLL_LOCK_INVALID_REASON");
    expect(error.name).toBe("ScrollError");
    expect(error).toBeInstanceOf(Error);
  });

  it("ScrollError accepts an optional cause", () => {
    const cause = new Error("root");
    const error = new ScrollError("test", "SCROLL_NOT_BROWSER", cause);
    expect(error.cause).toBe(cause);
  });
});

describe("BaseController — change event payload", () => {
  it("change event detail has state, previous, source fields", async () => {
    const controller = new ScrollController();
    controller.mount();
    const events: ScrollChangeDetail[] = [];
    controller.on("change", (detail) => events.push(detail));
    await Promise.resolve();
    expect(events.length).toBeGreaterThan(0);
    const init = events[0];
    expect(init.state).toBeDefined();
    expect(init.previous).toBeNull();
    expect(init.source).toBe("initialization");
    controller.destroy();
  });
});
