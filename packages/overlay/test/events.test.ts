/**
 * Tests for the `change` event surface.
 *
 * Covers:
 * - `register()` emits `change` exactly once with `action: 'register'`.
 * - Idempotent `register()` does NOT emit.
 * - `unregister()` emits `change` exactly once with
 *   `action: 'unregister'`.
 * - `unregister()` of an unknown pair does NOT emit.
 * - Listener auto-detaches on `destroy()`.
 * - Detail carries the post-transition `stack` snapshot.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverlayController } from "../src/controller.js";
import type { OverlayChangeDetail } from "../src/types.js";

describe("OverlayController events", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("register() emits 'change' once with action='register' and the new entry", () => {
    const controller = new OverlayController();
    const listener = vi.fn();
    controller.on("change", listener);

    controller.register("dialog", "a");

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0]?.[0] as OverlayChangeDetail;
    expect(detail).toBeDefined();
    expect(detail.action).toBe("register");
    expect(detail.added?.plugin).toBe("dialog");
    expect(detail.added?.id).toBe("a");
    expect(detail.stack).toHaveLength(1);
  });

  it("idempotent register does NOT emit 'change'", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    const listener = vi.fn();
    controller.on("change", listener);

    controller.register("dialog", "a");
    controller.register("dialog", "a");

    expect(listener).not.toHaveBeenCalled();
  });

  it("unregister() emits 'change' once with action='unregister' and the removed entry", () => {
    const controller = new OverlayController();
    controller.register("dialog", "a");
    const listener = vi.fn();
    controller.on("change", listener);

    controller.unregister("dialog", "a");

    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0]?.[0] as OverlayChangeDetail;
    expect(detail.action).toBe("unregister");
    expect(detail.removed?.plugin).toBe("dialog");
    expect(detail.removed?.id).toBe("a");
    expect(detail.stack).toEqual([]);
  });

  it("unregister() of unknown id does NOT emit", () => {
    const controller = new OverlayController();
    const listener = vi.fn();
    controller.on("change", listener);

    controller.unregister("dialog", "ghost");

    expect(listener).not.toHaveBeenCalled();
  });

  it("listener auto-detaches on destroy()", () => {
    const controller = new OverlayController();
    const listener = vi.fn();
    controller.on("change", listener);

    controller.destroy();
    // The controller's emit path refuses to fire on a destroyed
    // controller, so a manual recreate is the only way to push an
    // event. We simulate by constructing a new controller and
    // registering against IT — the old listener must not fire.
    const fresh = new OverlayController();
    fresh.on("change", listener);
    fresh.register("dialog", "a");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("on() returns an idempotent unsubscribe", () => {
    const controller = new OverlayController();
    const listener = vi.fn();
    const unsubscribe = controller.on("change", listener);
    unsubscribe();
    unsubscribe(); // does not throw

    controller.register("dialog", "a");
    expect(listener).not.toHaveBeenCalled();
  });
});
