import { clearAllSingletons, getSingleton } from "@ailuracode/alpine-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import { BATTERY_SINGLETON_KEY, type BatteryController } from "../src/battery-controller.js";
import envPlugin, {
  type BatteryMagic,
  type NetworkMagic,
  type PlatformMagic,
  type VisibilityMagic,
} from "../src/index.js";
import type { BatteryManagerLike } from "../src/internal/battery.js";
import { NETWORK_SINGLETON_KEY, type NetworkController } from "../src/network-controller.js";
import { PLATFORM_SINGLETON_KEY, type PlatformController } from "../src/platform-controller.js";
import {
  VISIBILITY_SINGLETON_KEY,
  type VisibilityController,
} from "../src/visibility-controller.js";

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

function countEventCalls(spy: ReturnType<typeof vi.spyOn>, name: string): number {
  return spy.mock.calls.filter((call: unknown[]) => call[0] === name).length;
}

describe("@ailuracode/alpine-env", () => {
  afterEach(() => {
    getSingleton<NetworkController>(NETWORK_SINGLETON_KEY)?.destroy();
    getSingleton<VisibilityController>(VISIBILITY_SINGLETON_KEY)?.destroy();
    getSingleton<BatteryController>(BATTERY_SINGLETON_KEY)?.destroy();
    getSingleton<PlatformController>(PLATFORM_SINGLETON_KEY)?.destroy();
    clearAllSingletons();
    vi.restoreAllMocks();
  });

  it("registers all environment magics by default", async () => {
    const manager = createBatteryManager({ level: 0.5 });
    const restore = mockGetBattery(() => Promise.resolve(manager));

    const harness = createMagicHarness(envPlugin()) as {
      network: NetworkMagic;
      visibility: VisibilityMagic;
      battery: BatteryMagic;
      platform: PlatformMagic;
    };

    await vi.waitFor(() => {
      expect(harness.battery.isAvailable).toBe(true);
    });

    expect(harness.network.isOnline).toBe(true);
    expect(harness.visibility.isVisible).toBe(true);
    expect(harness.platform.name).toBeTypeOf("string");
    expect(harness.battery.level).toBe(0.5);

    restore();
  });

  it("skips magics when disabled in options", () => {
    const harness = createMagicHarness(
      envPlugin({ network: true, visibility: false, battery: false, platform: false })
    ) as { network?: NetworkMagic; visibility?: VisibilityMagic };

    expect(harness.network?.isOnline).toBe(true);
    expect(harness.visibility).toBeUndefined();
  });

  it("does not duplicate active listeners on repeated registration", async () => {
    const addWindowSpy = vi.spyOn(window, "addEventListener");
    const addDocumentSpy = vi.spyOn(document, "addEventListener");
    const manager = createBatteryManager();
    const restore = mockGetBattery(() => Promise.resolve(manager));

    createMagicHarness(envPlugin());
    createMagicHarness(envPlugin());

    await vi.waitFor(() => {
      expect(manager.listenerCount("chargingchange")).toBe(1);
    });

    expect(countEventCalls(addWindowSpy, "online")).toBe(1);
    expect(countEventCalls(addWindowSpy, "offline")).toBe(1);
    expect(countEventCalls(addDocumentSpy, "visibilitychange")).toBe(1);
    expect(manager.listenerCount("chargingchange")).toBe(1);
    expect(manager.listenerCount("levelchange")).toBe(1);
    expect(manager.listenerCount("chargingtimechange")).toBe(1);
    expect(manager.listenerCount("dischargingtimechange")).toBe(1);

    restore();
  });
});
