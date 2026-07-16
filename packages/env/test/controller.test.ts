import { clearAllSingletons } from "@ailuracode/alpine-core/singleton";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createEnv, EnvController } from "../src/controller.js";
import type { BatteryManagerLike } from "../src/internal/battery.js";

function setNavigatorOnline(value: boolean): void {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

function setDocumentVisibility(hidden: boolean, visibilityState: "visible" | "hidden"): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
}

let originalNavigator: Navigator | undefined;

function installNavigatorMock(mockNavigator: Record<string, unknown>): void {
  if (originalNavigator === undefined) {
    originalNavigator = globalThis.navigator;
  }

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: mockNavigator,
  });
}

function restoreNavigator(): void {
  if (originalNavigator !== undefined) {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
    originalNavigator = undefined;
  }
}

function createBatteryManager(overrides: Partial<BatteryManagerLike> = {}) {
  const listeners = new Map<string, Set<EventListener>>();

  return {
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
}

function mockGetBattery(implementation: () => Promise<BatteryManagerLike>): () => void {
  const original = (navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> })
    .getBattery;

  Object.defineProperty(navigator, "getBattery", {
    configurable: true,
    value: implementation,
  });

  return () => {
    Object.defineProperty(navigator, "getBattery", {
      configurable: true,
      value: original,
      writable: true,
    });
  };
}

describe("@ailuracode/alpine-env EnvController", () => {
  afterEach(() => {
    clearAllSingletons();
    restoreNavigator();
    vi.restoreAllMocks();
  });

  it("constructs without touching browser globals", () => {
    setNavigatorOnline(false);
    setDocumentVisibility(true, "hidden");

    const controller = new EnvController();

    expect(controller.network.isOnline).toBe(true);
    expect(controller.visibility.isVisible).toBe(true);
    expect(controller.battery.isAvailable).toBe(false);
    expect(controller.platform.name).toBe("unknown");
  });

  it("mounts listeners and removes them on destroy", async () => {
    const addWindowSpy = vi.spyOn(window, "addEventListener");
    const removeWindowSpy = vi.spyOn(window, "removeEventListener");
    const addDocumentSpy = vi.spyOn(document, "addEventListener");
    const removeDocumentSpy = vi.spyOn(document, "removeEventListener");
    const manager = createBatteryManager();
    const restore = mockGetBattery(() => Promise.resolve(manager));
    const controller = new EnvController();

    controller.mount();

    await vi.waitFor(() => {
      expect(manager.listenerCount("chargingchange")).toBe(1);
    });

    expect(addWindowSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addWindowSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(addDocumentSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    controller.destroy();

    expect(removeWindowSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeWindowSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    expect(removeDocumentSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(manager.listenerCount("chargingchange")).toBe(0);
    expect(manager.listenerCount("levelchange")).toBe(0);

    restore();
  });

  it("updates network, visibility, battery, and platform state", async () => {
    setNavigatorOnline(true);
    setDocumentVisibility(false, "visible");
    installNavigatorMock({
      ...navigator,
      onLine: true,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      platform: "Win32",
      maxTouchPoints: 0,
    });
    const manager = createBatteryManager({ level: 0.8, charging: false });
    const restore = mockGetBattery(() => Promise.resolve(manager));
    const controller = new EnvController();

    controller.mount();

    await vi.waitFor(() => {
      expect(controller.battery.isAvailable).toBe(true);
    });

    expect(controller.platform.name).toBe("windows");
    expect(controller.platform.isWindows).toBe(true);

    setNavigatorOnline(false);
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    window.dispatchEvent(new Event("offline"));
    expect(controller.network.isOffline).toBe(true);

    setDocumentVisibility(true, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(controller.visibility.state).toBe("hidden");
    expect(controller.visibility.is("hidden")).toBe(true);

    manager.level = 0.4;
    manager.dispatchEvent(new Event("levelchange"));
    expect(controller.battery.level).toBe(0.4);

    controller.destroy();
    restore();
  });

  it("records battery errors without throwing", async () => {
    const restore = mockGetBattery(() => Promise.reject(new Error("unavailable")));
    const controller = new EnvController();

    controller.mount();
    await Promise.resolve();
    await Promise.resolve();

    expect(controller.battery.isAvailable).toBe(false);
    expect(controller.batteryError).toBeInstanceOf(Error);

    controller.destroy();
    restore();
  });

  it("mount and destroy are idempotent", () => {
    const addWindowSpy = vi.spyOn(window, "addEventListener");
    const controller = new EnvController();

    controller.mount();
    controller.mount();

    expect(addWindowSpy.mock.calls.filter(([name]) => name === "online")).toHaveLength(1);
    expect(addWindowSpy.mock.calls.filter(([name]) => name === "offline")).toHaveLength(1);

    controller.destroy();
    expect(() => controller.destroy()).not.toThrow();
  });

  it("createEnv returns a singleton EnvController", () => {
    const a = createEnv();
    const b = createEnv();

    expect(a).toBe(b);
    expect(a.network.isOnline).toBe(true);
  });

  it("platform.is() compares against platform name", () => {
    installNavigatorMock({
      ...navigator,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      platform: "iPhone",
      maxTouchPoints: 3,
    });
    const controller = new EnvController();

    controller.mount();

    expect(controller.platform.is("ios")).toBe(true);
    expect(controller.platform.is("windows")).toBe(false);

    controller.destroy();
  });

  it("ignores battery resolution after destroy", async () => {
    let resolveBattery!: (value: BatteryManagerLike) => void;
    const restore = mockGetBattery(
      () =>
        new Promise<BatteryManagerLike>((resolve) => {
          resolveBattery = resolve;
        })
    );
    const controller = new EnvController();

    controller.mount();
    controller.destroy();

    const manager = createBatteryManager();
    resolveBattery(manager);
    await vi.waitFor(() => {
      expect(true).toBe(true);
    });

    expect(controller.battery.isAvailable).toBe(false);

    restore();
  });
});
