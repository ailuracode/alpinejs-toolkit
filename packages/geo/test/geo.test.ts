import type AlpineType from "alpinejs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import geoPlugin, { type GeoStore } from "../src/index.js";

function createPosition(
  latitude = 40.4168,
  longitude = -3.7038,
  accuracy = 10
): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON() {
        return this;
      },
    },
    timestamp: 1_700_000_000_000,
    toJSON() {
      return this;
    },
  };
}

function createError(code: number, message: string): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  };
}

describe("@ailuracode/alpinejs-geo", () => {
  let store: GeoStore;
  let getCurrentPosition: ReturnType<typeof vi.fn>;
  let watchPosition: ReturnType<typeof vi.fn>;
  let clearWatch: ReturnType<typeof vi.fn>;

  beforeAll(() => {
    getCurrentPosition = vi.fn();
    watchPosition = vi.fn();
    clearWatch = vi.fn();

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition,
        watchPosition,
        clearWatch,
      },
    });

    const Alpine = startAlpine(geoPlugin);
    store = Alpine.store("geo") as GeoStore;
  });

  it("registers $store.geo with initial state", () => {
    expect(store.isSupported).toBe(true);
    expect(store.hasPosition).toBe(false);
    expect(store.isWatching).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.hasError).toBe(false);
  });

  it("request() resolves position data", async () => {
    const position = createPosition();
    getCurrentPosition.mockImplementation((success) => {
      success(position);
    });

    const ok = await store.request({ enableHighAccuracy: true });

    expect(ok).toBe(true);
    expect(store.hasPosition).toBe(true);
    expect(store.latitude).toBe(40.4168);
    expect(store.longitude).toBe(-3.7038);
    expect(store.accuracy).toBe(10);
    expect(store.timestamp).toBe(1_700_000_000_000);
    expect(store.isLoading).toBe(false);
    expect(store.hasError).toBe(false);
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
    });
  });

  it("request() captures geolocation errors", async () => {
    getCurrentPosition.mockImplementation((_success, error) => {
      error(createError(1, "User denied geolocation"));
    });

    const ok = await store.request();

    expect(ok).toBe(false);
    expect(store.hasPosition).toBe(false);
    expect(store.hasError).toBe(true);
    expect(store.error).toBe("User denied geolocation");
    expect(store.errorCode).toBe(1);
    expect(store.isLoading).toBe(false);
  });

  it("request() ignores stale responses from concurrent calls", async () => {
    vi.useFakeTimers();

    let calls = 0;
    getCurrentPosition.mockImplementation((success) => {
      calls += 1;
      if (calls === 1) {
        setTimeout(() => success(createPosition(1, 1)), 50);
        return;
      }

      success(createPosition(2, 2));
    });

    const first = store.request();
    const second = store.request();

    await vi.advanceTimersByTimeAsync(50);
    await Promise.all([first, second]);

    expect(store.latitude).toBe(2);
    expect(store.longitude).toBe(2);
    expect(store.isLoading).toBe(false);

    vi.useRealTimers();
  });

  it("watch() tracks position updates", () => {
    const position = createPosition(51.5074, -0.1278, 5);
    watchPosition.mockImplementation((success) => {
      success(position);
      return 42;
    });

    const started = store.watch();

    expect(started).toBe(true);
    expect(store.isWatching).toBe(true);
    expect(store.latitude).toBe(51.5074);
    expect(store.longitude).toBe(-0.1278);
    expect(store.accuracy).toBe(5);
    expect(watchPosition).toHaveBeenCalledOnce();
  });

  it("watch() returns false when already watching", () => {
    expect(store.watch()).toBe(false);
    expect(watchPosition).toHaveBeenCalledOnce();
  });

  it("unwatch() stops active watch", () => {
    expect(store.unwatch()).toBe(true);
    expect(store.isWatching).toBe(false);
    expect(clearWatch).toHaveBeenCalledWith(42);
  });

  it("unwatch() returns false when no watch is active", () => {
    expect(store.unwatch()).toBe(false);
  });

  it("watch() captures geolocation errors and clears coordinates", () => {
    watchPosition.mockImplementation((success, error) => {
      success(createPosition());
      error(createError(3, "Position request timed out"));
      return 7;
    });

    const started = store.watch();

    expect(started).toBe(true);
    expect(store.hasError).toBe(true);
    expect(store.error).toBe("Position request timed out");
    expect(store.errorCode).toBe(3);
    expect(store.hasPosition).toBe(false);
    expect(store.isWatching).toBe(true);
  });

  it("watch() returns false when geolocation is unsupported", () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {},
    });

    const stores: Record<string, unknown> = {};
    const magics: Record<string, unknown> = {};
    const Alpine = {
      store(name: string, value?: unknown) {
        if (value !== undefined) {
          stores[name] = value;
        }
        return stores[name];
      },
      magic(name: string, factory: () => unknown) {
        magics[name] = factory();
      },
    };

    geoPlugin(Alpine as unknown as AlpineType.Alpine);
    const unsupported = stores.geo as GeoStore;

    expect(unsupported.watch()).toBe(false);
    expect(unsupported.isWatching).toBe(false);

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition,
        watchPosition,
        clearWatch,
      },
    });
  });

  it("reset() clears position and error state", async () => {
    getCurrentPosition.mockImplementation((success) => {
      success(createPosition());
    });
    await store.request();

    expect(store.hasPosition).toBe(true);

    store.reset();

    expect(store.hasPosition).toBe(false);
    expect(store.latitude).toBeNull();
    expect(store.longitude).toBeNull();
    expect(store.hasError).toBe(false);
  });

  it("reports unsupported geolocation", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      writable: true,
      value: {},
    });

    const stores: Record<string, unknown> = {};
    const magics: Record<string, unknown> = {};
    const Alpine = {
      store(name: string, value?: unknown) {
        if (value !== undefined) {
          stores[name] = value;
        }
        return stores[name];
      },
      magic(name: string, factory: () => unknown) {
        magics[name] = factory();
      },
    };

    geoPlugin(Alpine as unknown as AlpineType.Alpine);
    const unsupported = stores.geo as GeoStore;

    expect(unsupported.isSupported).toBe(false);

    const ok = await unsupported.request();

    expect(ok).toBe(false);
    expect(unsupported.hasError).toBe(true);
    expect(unsupported.error).toBe("Geolocation is not supported");
  });
});
