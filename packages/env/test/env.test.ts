import { clearAllSingletons } from "@ailuracode/alpine-core/singleton";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import envPlugin, {
  type BatteryMagic,
  type NetworkMagic,
  type PlatformMagic,
  type VisibilityMagic,
} from "../src/index.js";
import type { BatteryManagerLike } from "../src/internal/battery.js";
import { resetEnvRuntimeForTests } from "../src/plugin.js";

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
  vi.stubGlobal("navigator", {
    onLine: true,
    getBattery: implementation,
  });

  return () => {
    vi.stubGlobal("navigator", { onLine: true });
  };
}

function countEventCalls(spy: ReturnType<typeof vi.fn>, name: string): number {
  return spy.mock.calls.filter((call: unknown[]) => call[0] === name).length;
}

function createEventTargetSpy() {
  const addEventListener = vi.fn((_type: string, _listener: EventListener) => undefined);
  const removeEventListener = vi.fn((_type: string, _listener: EventListener) => undefined);

  return {
    addEventListener,
    removeEventListener,
    dispatchEvent: vi.fn(() => true),
  };
}

describe("@ailuracode/alpine-env plugin", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { onLine: true });
  });

  afterEach(() => {
    resetEnvRuntimeForTests();
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
    const windowTarget = createEventTargetSpy();
    const documentTarget = createEventTargetSpy();
    vi.stubGlobal("window", windowTarget);
    vi.stubGlobal("document", documentTarget);
    const manager = createBatteryManager();
    const restore = mockGetBattery(() => Promise.resolve(manager));

    createMagicHarness(envPlugin());
    createMagicHarness(envPlugin());

    await vi.waitFor(() => {
      expect(manager.listenerCount("chargingchange")).toBe(1);
    });

    expect(countEventCalls(windowTarget.addEventListener, "online")).toBe(1);
    expect(countEventCalls(windowTarget.addEventListener, "offline")).toBe(1);
    expect(countEventCalls(documentTarget.addEventListener, "visibilitychange")).toBe(1);
    expect(manager.listenerCount("chargingchange")).toBe(1);
    expect(manager.listenerCount("levelchange")).toBe(1);
    expect(manager.listenerCount("chargingtimechange")).toBe(1);
    expect(manager.listenerCount("dischargingtimechange")).toBe(1);

    restore();
  });
});
