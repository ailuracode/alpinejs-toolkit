import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGeoPermissionAdapter,
  GEOLOCATION_PERMISSION_NAME,
} from "../src/permission-adapter.js";

describe("@ailuracode/alpine-geo/permission-adapter", () => {
  let originalIsSecureContext: unknown;
  let originalNavigator: unknown;

  beforeEach(() => {
    originalIsSecureContext = (globalThis as Record<string, unknown>).isSecureContext;
    originalNavigator = (globalThis as Record<string, unknown>).navigator;
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).isSecureContext = originalIsSecureContext;
    Object.defineProperty(globalThis, "navigator", { value: originalNavigator, configurable: true });
  });

  describe("createGeoPermissionAdapter", () => {
    it("exports GEOLOCATION_PERMISSION_NAME", () => {
      expect(GEOLOCATION_PERMISSION_NAME).toBe("geolocation");
    });

    it("returns insecure-context when not in secure context", () => {
      (globalThis as Record<string, unknown>).isSecureContext = false;
      const adapter = createGeoPermissionAdapter();
      expect(adapter.getAvailability()).toBe("insecure-context");
      expect(adapter.isSupported()).toBe(false);
    });

    it("returns unsupported when no geolocation API", () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      expect(adapter.getAvailability()).toBe("unsupported");
    });

    it("returns available in secure context with geolocation API", () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      expect(adapter.getAvailability()).toBe("available");
      expect(adapter.isSupported()).toBe(true);
    });

    it("query returns unknown when navigator undefined", async () => {
      const originalNav = (globalThis as Record<string, unknown>).navigator;
      Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("unknown");
      Object.defineProperty(globalThis, "navigator", { value: originalNav, configurable: true });
    });

    it("query returns granted when permissions API returns granted", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "granted" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("granted");
    });

    it("query returns denied when permissions API returns denied", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "denied" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("denied");
    });

    it("query returns unknown when permissions API throws", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: {
            query: vi.fn().mockRejectedValue(new Error("not supported")),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("unknown");
    });

    it("request returns insecure-context error", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = false;
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_INSECURE_CONTEXT");
    });

    it("request returns unsupported error when no API", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_UNSUPPORTED");
    });

    it("request returns granted when already granted", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "granted" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("granted");
    });

    it("request returns denied when already denied", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "denied" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_DENIED");
    });

    it("request prompts and returns granted", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      const getCurrentPosition = vi.fn((success: PositionCallback) => {
        success({} as GeolocationPosition);
      });
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "prompt" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("granted");
    });

    it("request prompts and handles permission denied", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      const getCurrentPosition = vi.fn(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          const err = { code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError;
          error(err);
        }
      );
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "prompt" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
    });

    it("request prompts and handles other error", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      const getCurrentPosition = vi.fn(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          const err = { code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError;
          error(err);
        }
      );
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition },
          permissions: {
            query: vi.fn().mockResolvedValue({ state: "prompt" }),
          },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("prompt");
    });

    it("subscribe returns no-op when navigator undefined", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      const originalNav = (globalThis as Record<string, unknown>).navigator;
      Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
      const adapter = createGeoPermissionAdapter();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(vi.fn());
        expect(dispose).toBeInstanceOf(Function);
      }
      Object.defineProperty(globalThis, "navigator", { value: originalNav, configurable: true });
    });

    it("subscribe returns no-op when permissions.query missing", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: { geolocation: { getCurrentPosition: vi.fn() } },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(vi.fn());
        expect(dispose).toBeInstanceOf(Function);
      }
    });

    it("subscribe notifies listener and cleans up", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      const listeners: Array<() => void> = [];
      const status = {
        state: "granted",
        addEventListener: vi.fn((_event: string, cb: () => void) => {
          listeners.push(cb);
        }),
        removeEventListener: vi.fn((_event: string, cb: () => void) => {
          const idx = listeners.indexOf(cb);
          if (idx >= 0) {
            listeners.splice(idx, 1);
          }
        }),
      };
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: { query: vi.fn().mockResolvedValue(status) },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      const listener = vi.fn();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(listener);

        await vi.waitFor(() => {
          expect(listener).toHaveBeenCalled();
        });

        listeners[0]?.();
        await vi.waitFor(() => {
          expect(listener.mock.calls.length).toBeGreaterThan(1);
        });

        dispose();
        expect(status.removeEventListener).toHaveBeenCalled();
      }
    });

    it("subscribe returns no-op when query throws", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      Object.defineProperty(globalThis, "navigator", {
        value: {
          geolocation: { getCurrentPosition: vi.fn() },
          permissions: { query: vi.fn().mockRejectedValue(new Error("not supported")) },
        },
        configurable: true,
      });
      const adapter = createGeoPermissionAdapter();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(vi.fn());
        expect(dispose).toBeInstanceOf(Function);
      }
    });
  });
});