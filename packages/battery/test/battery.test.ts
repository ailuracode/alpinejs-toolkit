import { describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import batteryPlugin, {
  type BatteryMagic,
  type BatteryManagerLike,
  readBatteryState,
} from "../src/index.js";

function createBatteryManager(overrides: Partial<BatteryManagerLike> = {}): BatteryManagerLike {
  const listeners = new Map<string, Set<EventListener>>();

  return {
    charging: false,
    chargingTime: Number.POSITIVE_INFINITY,
    dischargingTime: 3600,
    level: 0.75,
    onchargingchange: null,
    onchargingtimechange: null,
    ondischargingtimechange: null,
    onlevelchange: null,
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
    ...overrides,
  } as BatteryManagerLike;
}

function mockGetBattery(implementation: () => Promise<BatteryManagerLike>): () => void {
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
  const original = nav.getBattery;

  Object.defineProperty(navigator, "getBattery", {
    configurable: true,
    value: implementation,
  });

  return () => {
    if (original) {
      Object.defineProperty(navigator, "getBattery", {
        configurable: true,
        value: original,
      });
    } else {
      Object.defineProperty(navigator, "getBattery", {
        configurable: true,
        value: undefined,
        writable: true,
      });
    }
  };
}

describe("@ailuracode/alpinejs-battery", () => {
  it("registers $battery with unavailable defaults when getBattery is missing", () => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    const original = nav.getBattery;
    nav.getBattery = undefined;

    const { battery } = createMagicHarness(batteryPlugin) as { battery: BatteryMagic };

    expect(battery.isAvailable).toBe(false);
    expect(battery.level).toBeNull();
    expect(battery.isCharging).toBe(false);

    if (original) {
      nav.getBattery = original;
    }
  });

  it("loads battery state when getBattery resolves", async () => {
    const manager = createBatteryManager({
      charging: true,
      level: 0.5,
      chargingTime: 1200,
      dischargingTime: Number.POSITIVE_INFINITY,
    });

    const restore = mockGetBattery(() => Promise.resolve(manager));

    const { battery } = createMagicHarness(batteryPlugin) as { battery: BatteryMagic };

    await vi.waitFor(() => {
      expect(battery.isAvailable).toBe(true);
    });

    expect(battery.level).toBe(0.5);
    expect(battery.isCharging).toBe(true);
    expect(battery.chargingTime).toBe(1200);
    expect(battery.dischargingTime).toBeNull();

    restore();
  });

  it("updates state on battery events", async () => {
    const manager = createBatteryManager({ level: 0.8, charging: false });

    const restore = mockGetBattery(() => Promise.resolve(manager));

    const { battery } = createMagicHarness(batteryPlugin) as { battery: BatteryMagic };

    await vi.waitFor(() => {
      expect(battery.isAvailable).toBe(true);
    });

    manager.level = 0.4;
    manager.dispatchEvent(new Event("levelchange"));

    expect(battery.level).toBe(0.4);

    manager.charging = true;
    manager.dispatchEvent(new Event("chargingchange"));

    expect(battery.isCharging).toBe(true);

    restore();
  });

  it("keeps unavailable state when getBattery rejects", async () => {
    const restore = mockGetBattery(() => Promise.reject(new Error("unavailable")));

    const { battery } = createMagicHarness(batteryPlugin) as { battery: BatteryMagic };

    await Promise.resolve();

    expect(battery.isAvailable).toBe(false);
    expect(battery.level).toBeNull();

    restore();
  });
});

describe("readBatteryState", () => {
  it("returns unavailable defaults without a manager", () => {
    expect(readBatteryState()).toEqual({
      isAvailable: false,
      level: null,
      isCharging: false,
      chargingTime: null,
      dischargingTime: null,
    });
  });

  it("normalizes infinite time values to null", () => {
    const manager = createBatteryManager({
      chargingTime: Number.POSITIVE_INFINITY,
      dischargingTime: Number.POSITIVE_INFINITY,
    });

    const state = readBatteryState(manager);

    expect(state.isAvailable).toBe(true);
    expect(state.chargingTime).toBeNull();
    expect(state.dischargingTime).toBeNull();
  });
});
