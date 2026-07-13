import { describe, expect, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine";
import {
  AttentionController,
  createAttentionController,
  createIdleState,
  createWakeLockController,
  createWakeLockState,
  IdleController,
  type IdleDetectorConstructor,
  type IdleDetectorLike,
  type IdleMagic,
  isIdleDetectionSupported,
  isWakeLockSupported,
  MIN_IDLE_THRESHOLD,
  normalizeIdleThreshold,
  readIdlePermissionStatus,
  WakeLockController,
  type WakeLockSentinelLike,
} from "../src/controller.js";
import attentionPlugin, { type WakeLockMagic } from "../src/index";

// ── Test helpers ────────────────────────────────────────────────

function createWakeLockSentinel(
  overrides: Partial<WakeLockSentinelLike> = {}
): WakeLockSentinelLike {
  const listeners = new Map<string, Set<EventListener>>();

  return {
    released: false,
    addEventListener(type: string, listener: EventListener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)?.add(listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    release() {
      this.released = true;
      const handlers = listeners.get("release");
      if (handlers) {
        for (const listener of handlers) {
          listener(new Event("release"));
        }
      }
      return Promise.resolve();
    },
    ...overrides,
  };
}

type IdleDetectorMock = IdleDetectorLike & { dispatchChange(): void };

function createIdleDetector(overrides: Partial<IdleDetectorMock> = {}): IdleDetectorMock {
  const listeners = new Map<string, Set<EventListener>>();

  return {
    userState: "active",
    screenState: "unlocked",
    start() {
      return Promise.resolve();
    },
    addEventListener(type: string, listener: EventListener) {
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      listeners.get(type)?.add(listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchChange() {
      const handlers = listeners.get("change");
      if (handlers) {
        for (const listener of handlers) {
          listener(new Event("change"));
        }
      }
    },
    ...overrides,
  };
}

function createIdleDetectorClass(detector: IdleDetectorMock): IdleDetectorConstructor {
  class TestIdleDetector implements IdleDetectorLike {
    static requestPermission() {
      return Promise.resolve("granted" as PermissionState);
    }

    get userState() {
      return detector.userState;
    }

    get screenState() {
      return detector.screenState;
    }

    start(options?: { threshold?: number }) {
      return detector.start(options);
    }

    addEventListener(type: string, listener: EventListener) {
      detector.addEventListener(type, listener);
    }

    removeEventListener(type: string, listener: EventListener) {
      detector.removeEventListener(type, listener);
    }
  }

  return TestIdleDetector as unknown as IdleDetectorConstructor;
}

function mockWakeLock(request: () => Promise<WakeLockSentinelLike>): () => void {
  const original = (
    navigator as Navigator & { wakeLock?: { request: () => Promise<WakeLockSentinelLike> } }
  ).wakeLock;

  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: { request },
  });

  return () => {
    if (original) {
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value: original,
      });
    } else {
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value: undefined,
        writable: true,
      });
    }
  };
}

function mockIdleDetector(implementation: IdleDetectorConstructor): () => void {
  const original = Reflect.get(globalThis, "IdleDetector");

  Object.defineProperty(globalThis, "IdleDetector", {
    configurable: true,
    value: implementation,
  });

  return () => {
    if (original) {
      Object.defineProperty(globalThis, "IdleDetector", {
        configurable: true,
        value: original,
      });
    } else {
      Reflect.deleteProperty(globalThis, "IdleDetector");
    }
  };
}

// ── Headless WakeLockController ─────────────────────────────────

describe("WakeLockController", () => {
  it("reports unsupported when wakeLock API is absent", () => {
    const restore = mockWakeLock(() => Promise.resolve(createWakeLockSentinel()));
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: undefined,
      writable: true,
    });

    const wl = new WakeLockController();
    expect(wl.isSupported).toBe(false);
    expect(wl.isActive).toBe(false);

    restore();
  });

  it("acquires and releases a wake lock", async () => {
    const sentinel = createWakeLockSentinel();
    const restore = mockWakeLock(() => Promise.resolve(sentinel));

    const wl = createWakeLockController();
    wl.mount();

    expect(await wl.request()).toBe(true);
    expect(wl.isActive).toBe(true);

    expect(await wl.release()).toBe(true);
    expect(wl.isActive).toBe(false);
    expect(sentinel.released).toBe(true);

    wl.destroy();
    restore();
  });

  it("emits wakelock:change on state transitions", async () => {
    const sentinel = createWakeLockSentinel();
    const restore = mockWakeLock(() => Promise.resolve(sentinel));
    const wl = new WakeLockController();
    wl.mount();

    const changes: Array<{ isActive: boolean; isRequesting: boolean; error: string | null }> = [];
    wl.on("wakelock:change", (d) => changes.push({ ...d }));

    await wl.request();
    expect(changes.length).toBeGreaterThanOrEqual(1);
    expect(changes[changes.length - 1].isActive).toBe(true);

    await wl.release();
    expect(changes[changes.length - 1].isActive).toBe(false);

    wl.destroy();
    restore();
  });

  it("re-acquires on visibility change when wantsLock is true", async () => {
    let requestCount = 0;
    let lastSentinel: WakeLockSentinelLike | undefined;
    const restore = mockWakeLock(() => {
      requestCount += 1;
      lastSentinel = createWakeLockSentinel();
      return Promise.resolve(lastSentinel);
    });

    const wl = new WakeLockController();
    wl.mount();

    await wl.request();
    expect(requestCount).toBe(1);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    await lastSentinel?.release();

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await vi.waitFor(() => {
      expect(requestCount).toBe(2);
    });

    wl.destroy();
    restore();
  });

  it("destroy releases an active wake lock", async () => {
    const sentinel = createWakeLockSentinel();
    const releaseSpy = vi.spyOn(sentinel, "release");
    const restore = mockWakeLock(() => Promise.resolve(sentinel));

    const wl = new WakeLockController();
    wl.mount();
    await wl.request();
    expect(wl.isActive).toBe(true);

    wl.destroy();
    expect(releaseSpy).toHaveBeenCalled();
    expect(wl.isActive).toBe(false);

    restore();
  });

  it("destroy is idempotent", async () => {
    const sentinel = createWakeLockSentinel();
    const restore = mockWakeLock(() => Promise.resolve(sentinel));

    const wl = new WakeLockController();
    wl.mount();
    await wl.request();

    wl.destroy();
    expect(() => wl.destroy()).not.toThrow();

    restore();
  });

  it("request after destroy returns false", async () => {
    const sentinel = createWakeLockSentinel();
    const restore = mockWakeLock(() => Promise.resolve(sentinel));

    const wl = new WakeLockController();
    wl.mount();
    wl.destroy();

    expect(await wl.request()).toBe(false);

    restore();
  });

  it("mount is idempotent", () => {
    const sentinel = createWakeLockSentinel();
    const restore = mockWakeLock(() => Promise.resolve(sentinel));

    const wl = new WakeLockController();
    wl.mount();
    wl.mount();

    expect(wl.phase).toBe("mounted");

    wl.destroy();
    restore();
  });
});

// ── Headless IdleController ─────────────────────────────────────

describe("IdleController", () => {
  it("reports unsupported when IdleDetector is missing", () => {
    const restore = mockIdleDetector(class {} as IdleDetectorConstructor);
    Reflect.deleteProperty(globalThis, "IdleDetector");

    const idle = new IdleController();
    expect(idle.isSupported).toBe(false);
    expect(idle.isWatching).toBe(false);
    expect(idle.userState).toBeNull();

    restore();
  });

  it("uses injected IdleDetectorConstructor", () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    expect(idle.isSupported).toBe(true);
  });

  it("starts and stops idle detection", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();

    const changes: Array<{ isWatching: boolean }> = [];
    idle.on("idle:change", (d) => changes.push({ isWatching: d.isWatching }));

    expect(await idle.start()).toBe(true);
    expect(idle.isWatching).toBe(true);

    expect(idle.stop()).toBe(true);
    expect(idle.isWatching).toBe(false);
    expect(idle.userState).toBeNull();

    idle.destroy();
  });

  it("updates state on change events", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();

    await idle.start();

    detector.userState = "idle";
    detector.screenState = "locked";
    detector.dispatchChange();

    expect(idle.isIdle).toBe(true);
    expect(idle.isActive).toBe(false);
    expect(idle.screenState).toBe("locked");

    idle.destroy();
  });

  it("normalizes threshold below minimum", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const startSpy = vi.spyOn(detector, "start");
    const idle = new IdleController(Ctor);
    idle.mount();

    await idle.start({ threshold: 30_000 });
    expect(startSpy).toHaveBeenCalledWith({ threshold: MIN_IDLE_THRESHOLD });
    expect(idle.threshold).toBe(MIN_IDLE_THRESHOLD);

    idle.destroy();
  });

  it("emits idle:change with error and threshold", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();

    const changes: Array<{ error: string | null; threshold: number }> = [];
    idle.on("idle:change", (d) => changes.push({ error: d.error, threshold: d.threshold }));

    await idle.start({ threshold: 120_000 });

    const last = changes[changes.length - 1];
    expect(last.threshold).toBe(120_000);
    expect(last.error).toBeNull();

    idle.destroy();
  });

  it("destroy is idempotent", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();
    await idle.start();

    idle.destroy();
    expect(() => idle.destroy()).not.toThrow();
    expect(idle.isWatching).toBe(false);
  });

  it("start after destroy returns false", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();
    idle.destroy();

    expect(await idle.start()).toBe(false);
  });

  it("requestPermission after destroy returns denied", async () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();
    idle.destroy();

    expect(await idle.requestPermission()).toBe("denied");
  });

  it("mount is idempotent", () => {
    const detector = createIdleDetector();
    const Ctor = createIdleDetectorClass(detector);
    const idle = new IdleController(Ctor);
    idle.mount();
    idle.mount();
    expect(idle.phase).toBe("mounted");
    idle.destroy();
  });
});

// ── Headless AttentionController ────────────────────────────────

describe("AttentionController", () => {
  it("composes wakeLock and idle controllers", () => {
    const ac = createAttentionController();
    expect(ac.wakeLock).toBeInstanceOf(WakeLockController);
    expect(ac.idle).toBeInstanceOf(IdleController);
    ac.destroy();
  });

  it("mount and destroy both sub-controllers", () => {
    const ac = new AttentionController();
    ac.mount();
    expect(ac.wakeLock.phase).toBe("mounted");
    expect(ac.idle.phase).toBe("mounted");

    ac.destroy();
    expect(ac.wakeLock.phase).toBe("destroyed");
    expect(ac.idle.phase).toBe("destroyed");
  });

  it("destroy is idempotent", () => {
    const ac = new AttentionController();
    ac.mount();
    ac.destroy();
    expect(() => ac.destroy()).not.toThrow();
  });
});

// ── Alpine plugin integration ───────────────────────────────────

describe("@ailuracode/alpine-attention", () => {
  describe("$wakelock", () => {
    it("registers $wakelock with unsupported defaults when wakeLock is missing", () => {
      const restore = mockWakeLock(() => Promise.resolve(createWakeLockSentinel()));
      Object.defineProperty(navigator, "wakeLock", {
        configurable: true,
        value: undefined,
        writable: true,
      });

      const { wakelock } = createMagicHarness(attentionPlugin) as { wakelock: WakeLockMagic };

      expect(wakelock.isSupported).toBe(false);
      expect(wakelock.isActive).toBe(false);
      expect(wakelock.isRequesting).toBe(false);

      restore();
    });

    it("acquires and releases a wake lock", async () => {
      const sentinel = createWakeLockSentinel();
      const restore = mockWakeLock(() => Promise.resolve(sentinel));

      const { wakelock } = createMagicHarness(attentionPlugin) as { wakelock: WakeLockMagic };

      await expect(wakelock.request()).resolves.toBe(true);
      expect(wakelock.isActive).toBe(true);

      await expect(wakelock.release()).resolves.toBe(true);
      expect(wakelock.isActive).toBe(false);
      expect(sentinel.released).toBe(true);

      restore();
    });

    it("updates isActive when the sentinel releases", async () => {
      const sentinel = createWakeLockSentinel();
      const restore = mockWakeLock(() => Promise.resolve(sentinel));

      const { wakelock } = createMagicHarness(attentionPlugin) as { wakelock: WakeLockMagic };

      await wakelock.request();
      await sentinel.release();

      expect(wakelock.isActive).toBe(false);

      restore();
    });

    it("re-acquires the wake lock when the tab becomes visible again", async () => {
      let requestCount = 0;
      let lastSentinel: WakeLockSentinelLike | undefined;
      const restore = mockWakeLock(() => {
        requestCount += 1;
        lastSentinel = createWakeLockSentinel();
        return Promise.resolve(lastSentinel);
      });

      const { wakelock } = createMagicHarness(attentionPlugin) as { wakelock: WakeLockMagic };

      await wakelock.request();
      expect(requestCount).toBe(1);

      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      await lastSentinel?.release();

      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));

      await vi.waitFor(() => {
        expect(requestCount).toBe(2);
      });

      restore();
    });
  });

  describe("$idle", () => {
    it("registers $idle with unsupported defaults when IdleDetector is missing", () => {
      const restore = mockIdleDetector(class {} as IdleDetectorConstructor);
      Reflect.deleteProperty(globalThis, "IdleDetector");

      const { idle } = createMagicHarness(attentionPlugin) as { idle: IdleMagic };

      expect(idle.isSupported).toBe(false);
      expect(idle.isWatching).toBe(false);
      expect(idle.userState).toBeNull();

      restore();
    });

    it("requests permission and starts idle detection", async () => {
      const detector = createIdleDetector({
        userState: "active",
        screenState: "unlocked",
      });
      const startSpy = vi.spyOn(detector, "start");

      const restore = mockIdleDetector(createIdleDetectorClass(detector));

      const { idle } = createMagicHarness(attentionPlugin) as { idle: IdleMagic };

      await expect(idle.requestPermission()).resolves.toBe("granted");
      await expect(idle.start({ threshold: 30_000 })).resolves.toBe(true);

      expect(startSpy).toHaveBeenCalledWith({ threshold: MIN_IDLE_THRESHOLD });
      expect(idle.isWatching).toBe(true);
      expect(idle.threshold).toBe(MIN_IDLE_THRESHOLD);
      expect(idle.isActive).toBe(true);
      expect(idle.isIdle).toBe(false);
      expect(idle.screenState).toBe("unlocked");

      restore();
    });

    it("restarts idle detection when threshold changes", async () => {
      const detector = createIdleDetector();
      const startSpy = vi.spyOn(detector, "start");

      const restore = mockIdleDetector(createIdleDetectorClass(detector));

      const { idle } = createMagicHarness(attentionPlugin) as { idle: IdleMagic };

      await idle.start({ threshold: MIN_IDLE_THRESHOLD });
      expect(startSpy).toHaveBeenCalledTimes(1);

      startSpy.mockClear();
      await idle.start({ threshold: MIN_IDLE_THRESHOLD });
      expect(startSpy).not.toHaveBeenCalled();

      await idle.start({ threshold: MIN_IDLE_THRESHOLD * 2 });
      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(startSpy).toHaveBeenCalledWith({ threshold: MIN_IDLE_THRESHOLD * 2 });
      expect(idle.threshold).toBe(MIN_IDLE_THRESHOLD * 2);

      restore();
    });

    it("updates state on idle change events", async () => {
      const detector = createIdleDetector();

      const restore = mockIdleDetector(createIdleDetectorClass(detector));

      const { idle } = createMagicHarness(attentionPlugin) as { idle: IdleMagic };

      await idle.start();
      detector.userState = "idle";
      detector.screenState = "locked";
      detector.dispatchChange();

      expect(idle.isIdle).toBe(true);
      expect(idle.isActive).toBe(false);
      expect(idle.screenState).toBe("locked");

      restore();
    });

    it("stops idle detection and clears state", async () => {
      const detector = createIdleDetector();

      const restore = mockIdleDetector(createIdleDetectorClass(detector));

      const { idle } = createMagicHarness(attentionPlugin) as { idle: IdleMagic };

      await idle.start();
      expect(idle.stop()).toBe(true);
      expect(idle.isWatching).toBe(false);
      expect(idle.userState).toBeNull();

      restore();
    });

    it("does not start when idle permission is denied", async () => {
      const restoreDetector = mockIdleDetector(createIdleDetectorClass(createIdleDetector()));
      const query = vi.spyOn(navigator.permissions, "query").mockResolvedValue({
        state: "denied",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as PermissionStatus);

      const { idle } = createMagicHarness(attentionPlugin) as { idle: IdleMagic };

      await vi.waitFor(() => {
        expect(idle.permission).toBe("denied");
      });

      const IdleDetector = Reflect.get(globalThis, "IdleDetector") as IdleDetectorConstructor;
      const requestPermission = vi.spyOn(IdleDetector, "requestPermission");

      await expect(idle.start()).resolves.toBe(false);
      expect(requestPermission).not.toHaveBeenCalled();
      expect(idle.error).toContain("blocked");

      query.mockRestore();
      restoreDetector();
    });
  });
});

// ── Helpers ─────────────────────────────────────────────────────

describe("helpers", () => {
  it("detects wake lock support", () => {
    const restore = mockWakeLock(() => Promise.resolve(createWakeLockSentinel()));
    expect(isWakeLockSupported()).toBe(true);

    Object.defineProperty(navigator, "wakeLock", {
      configurable: true,
      value: undefined,
      writable: true,
    });
    expect(isWakeLockSupported()).toBe(false);

    restore();
  });

  it("detects idle detection support", () => {
    const detector = createIdleDetector();
    const restore = mockIdleDetector(createIdleDetectorClass(detector));
    expect(isIdleDetectionSupported()).toBe(true);

    Reflect.deleteProperty(globalThis, "IdleDetector");
    expect(isIdleDetectionSupported()).toBe(false);

    restore();
  });

  it("returns unavailable defaults", () => {
    expect(createWakeLockState(false)).toEqual({
      error: null,
      isRequesting: false,
      isActive: false,
      isSupported: false,
    });

    expect(createIdleState(false)).toEqual({
      userState: null,
      screenState: null,
      permission: null,
      error: null,
      threshold: 60_000,
      isLoading: false,
      isWatching: false,
      isSupported: false,
    });
  });

  it("clamps idle thresholds below one minute", () => {
    expect(normalizeIdleThreshold(30_000)).toBe(MIN_IDLE_THRESHOLD);
    expect(normalizeIdleThreshold(120_000)).toBe(120_000);
  });

  it("returns null when idle permission cannot be queried", async () => {
    const query = vi
      .spyOn(navigator.permissions, "query")
      .mockRejectedValue(new Error("unsupported"));

    await expect(readIdlePermissionStatus()).resolves.toBeNull();

    query.mockRestore();
  });
});
