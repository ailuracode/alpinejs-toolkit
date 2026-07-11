import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NetworkController } from "../src/network-controller.js";

function setNavigatorOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("@ailuracode/alpine-env NetworkController", () => {
  afterEach(() => {
    clearAllSingletons();
    vi.restoreAllMocks();
  });

  it("constructs without touching browser globals", () => {
    setNavigatorOnline(false);

    const controller = new NetworkController();

    expect(controller.isOnline).toBe(true);
    expect(controller.isOffline).toBe(false);
  });

  it("mounts listeners and removes them on destroy", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const controller = new NetworkController();

    controller.mount();

    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    controller.destroy();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("updates state on offline and online events", () => {
    setNavigatorOnline(true);
    const controller = new NetworkController();

    controller.mount();
    expect(controller.isOnline).toBe(true);
    expect(controller.isOffline).toBe(false);

    setNavigatorOnline(false);
    window.dispatchEvent(new Event("offline"));

    expect(controller.isOnline).toBe(false);
    expect(controller.isOffline).toBe(true);

    setNavigatorOnline(true);
    window.dispatchEvent(new Event("online"));

    expect(controller.isOnline).toBe(true);
    expect(controller.isOffline).toBe(false);
  });

  it("destroy is idempotent", () => {
    const controller = new NetworkController();

    controller.mount();
    controller.destroy();

    expect(() => controller.destroy()).not.toThrow();
  });
});
