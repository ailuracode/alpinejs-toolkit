import { clearAllSingletons } from "@ailuracode/alpine-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BatteryController } from "../src/battery-controller.js";
import type { BatteryManagerLike } from "../src/internal/battery.js";

function createBatteryManager(overrides: Partial<BatteryManagerLike> = {}) {
  const listeners = new Map<string, Set<EventListener>>();

  const manager: BatteryManagerLike & { listenerCount(type: string): number } = {
    charging: false,
    chargingTime: Number.POSITIVE_INFINITY,
    dischargingTime: 3600,
    level: 0.75,
    addEventListener(type: string, listener: EventListener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)?.add(listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event: Event) {
      const handlers = listeners.get(event.type);
      if (handlers) {
        for (const listener of handlers) {
          listener(event);
        }
      }
      return true;
    },
    listenerCount(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
    ...overrides,
  };

  return manager;
}

function mockGetBattery(implementation: () => Promise<BatteryManagerLike>): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const original = navigator;

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      ...original,
      getBattery: implementation,
    },
  });

  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, "navigator", descriptor);
      return;
    }

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: original,
    });
  };
}

describe("@ailuracode/alpine-env BatteryController", () => {
  afterEach(() => {
    clearAllSingletons();
    vi.restoreAllMocks();
  });

  it("starts unavailable and loads battery state on mount", async () => {
    const manager = createBatteryManager({
      charging: true,
      level: 0.5,
      chargingTime: 1200,
      dischargingTime: Number.POSITIVE_INFINITY,
    });
    const restore = mockGetBattery(() => Promise.resolve(manager));
    const controller = new BatteryController();

    expect(controller.isAvailable).toBe(false);

    controller.mount();

    await vi.waitFor(() => {
      expect(controller.isAvailable).toBe(true);
    });

    expect(controller.level).toBe(0.5);
    expect(controller.isCharging).toBe(true);
    expect(controller.chargingTime).toBe(1200);
    expect(controller.dischargingTime).toBeNull();

    controller.destroy();
    restore();
  });

  it("updates state on battery events and removes listeners on destroy", async () => {
    const manager = createBatteryManager({ level: 0.8, charging: false });
    const restore = mockGetBattery(() => Promise.resolve(manager));
    const controller = new BatteryController();

    controller.mount();

    await vi.waitFor(() => {
      expect(controller.isAvailable).toBe(true);
    });

    expect(manager.listenerCount("chargingchange")).toBe(1);
    expect(manager.listenerCount("levelchange")).toBe(1);
    expect(manager.listenerCount("chargingtimechange")).toBe(1);
    expect(manager.listenerCount("dischargingtimechange")).toBe(1);

    manager.level = 0.4;
    manager.dispatchEvent(new Event("levelchange"));
    expect(controller.level).toBe(0.4);

    controller.destroy();

    expect(manager.listenerCount("chargingchange")).toBe(0);
    expect(manager.listenerCount("levelchange")).toBe(0);
    expect(manager.listenerCount("chargingtimechange")).toBe(0);
    expect(manager.listenerCount("dischargingtimechange")).toBe(0);

    restore();
  });

  it("logs and stays unavailable when getBattery rejects", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const restore = mockGetBattery(() => Promise.reject(new Error("unavailable")));
    const controller = new BatteryController();

    controller.mount();
    await Promise.resolve();
    await Promise.resolve();

    expect(controller.isAvailable).toBe(false);
    expect(controller.level).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    controller.destroy();
    restore();
  });

  it("destroy is idempotent", () => {
    const controller = new BatteryController();

    controller.destroy();

    expect(() => controller.destroy()).not.toThrow();
  });
});
