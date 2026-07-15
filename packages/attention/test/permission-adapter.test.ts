import { afterEach, describe, expect, it, vi } from "vitest";
import { createIdlePermissionAdapter, IDLE_PERMISSION_NAME } from "../src/permission-adapter.js";

function createMockCtor(options: { requestPermission?: ReturnType<typeof vi.fn> } = {}) {
  return {
    requestPermission: options.requestPermission ?? vi.fn(),
  } as unknown as import("../src/types.js").IdleDetectorConstructor;
}

function stubNavigator(value: unknown): void {
  vi.stubGlobal("navigator", value);
}

async function callSubscribe(
  adapter: ReturnType<typeof createIdlePermissionAdapter>,
  listener: Parameters<NonNullable<typeof adapter.subscribe>>[0]
): Promise<() => void> {
  const subscribe = adapter.subscribe;
  if (typeof subscribe !== "function") {
    throw new Error("expected subscribe");
  }
  expect(subscribe).toBeTypeOf("function");
  return await subscribe.call(adapter, listener);
}

describe("@ailuracode/alpine-attention/permission-adapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("createIdlePermissionAdapter", () => {
    it("exports IDLE_PERMISSION_NAME", () => {
      expect(IDLE_PERMISSION_NAME).toBe("idle-detection");
    });

    it("returns insecure-context when not in secure context", () => {
      vi.stubGlobal("isSecureContext", false);
      const adapter = createIdlePermissionAdapter(createMockCtor());
      expect(adapter.getAvailability()).toBe("insecure-context");
      expect(adapter.isSupported()).toBe(false);
    });

    it("returns unsupported when no constructor", () => {
      vi.stubGlobal("isSecureContext", true);
      const adapter = createIdlePermissionAdapter(null);
      expect(adapter.getAvailability()).toBe("unsupported");
      expect(adapter.isSupported()).toBe(false);
    });

    it("returns unsupported when constructor lacks requestPermission", () => {
      vi.stubGlobal("isSecureContext", true);
      const adapter = createIdlePermissionAdapter(
        {} as unknown as import("../src/types.js").IdleDetectorConstructor
      );
      expect(adapter.getAvailability()).toBe("unsupported");
    });

    it("returns available when in secure context with constructor", () => {
      vi.stubGlobal("isSecureContext", true);
      const adapter = createIdlePermissionAdapter(createMockCtor());
      expect(adapter.getAvailability()).toBe("available");
      expect(adapter.isSupported()).toBe(true);
    });

    it("query returns normalized permission state", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "granted" }),
        },
      });
      const adapter = createIdlePermissionAdapter(createMockCtor());
      const result = await adapter.query();
      expect(result).toBe("granted");
    });

    it("query returns unknown for null status", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: null }),
        },
      });
      const adapter = createIdlePermissionAdapter(createMockCtor());
      const result = await adapter.query();
      expect(result).toBe("unknown");
    });

    it("request returns denied when not available", async () => {
      vi.stubGlobal("isSecureContext", false);
      const adapter = createIdlePermissionAdapter(createMockCtor());
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_INSECURE_CONTEXT");
    });

    it("request returns unsupported error when no constructor", async () => {
      vi.stubGlobal("isSecureContext", true);
      const adapter = createIdlePermissionAdapter(null);
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_UNSUPPORTED");
    });

    it("request returns granted when already granted", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "granted" }),
        },
      });
      const adapter = createIdlePermissionAdapter(createMockCtor());
      const result = await adapter.request();
      expect(result.permission).toBe("granted");
    });

    it("request returns denied when already denied", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "denied" }),
        },
      });
      const adapter = createIdlePermissionAdapter(createMockCtor());
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
    });

    it("request prompts for permission when prompt state", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
      });
      const requestPermission = vi.fn().mockResolvedValue("granted");
      const adapter = createIdlePermissionAdapter(createMockCtor({ requestPermission }));
      const result = await adapter.request();
      expect(result.permission).toBe("granted");
      expect(requestPermission).toHaveBeenCalled();
    });

    it("request handles prompt returning denied", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
      });
      const requestPermission = vi.fn().mockResolvedValue("denied");
      const adapter = createIdlePermissionAdapter(createMockCtor({ requestPermission }));
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
    });

    it("request handles prompt returning unknown", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
      });
      const requestPermission = vi.fn().mockResolvedValue("invalid");
      const adapter = createIdlePermissionAdapter(createMockCtor({ requestPermission }));
      const result = await adapter.request();
      expect(result.permission).toBe("unknown");
    });

    it("request handles requestPermission throwing", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
      });
      const requestPermission = vi.fn().mockRejectedValue(new Error("user denied"));
      const adapter = createIdlePermissionAdapter(createMockCtor({ requestPermission }));
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_REQUEST_FAILED");
    });

    it("request handles requestPermission throwing non-Error", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue({ state: "prompt" }),
        },
      });
      const requestPermission = vi.fn().mockRejectedValue("string error");
      const adapter = createIdlePermissionAdapter(createMockCtor({ requestPermission }));
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
    });

    it("subscribe returns no-op when navigator undefined", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator(undefined);
      const adapter = createIdlePermissionAdapter(createMockCtor());
      expect(adapter.subscribe).toBeTypeOf("function");
      const dispose = await callSubscribe(adapter, vi.fn());
      expect(dispose).toBeInstanceOf(Function);
      dispose();
    });

    it("subscribe returns no-op when permissions.query missing", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({});
      const adapter = createIdlePermissionAdapter(createMockCtor());
      expect(adapter.subscribe).toBeTypeOf("function");
      const dispose = await callSubscribe(adapter, vi.fn());
      expect(dispose).toBeInstanceOf(Function);
    });

    it("subscribe notifies listener and cleans up", async () => {
      vi.stubGlobal("isSecureContext", true);
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
      stubNavigator({
        permissions: {
          query: vi.fn().mockResolvedValue(status),
        },
      });
      const adapter = createIdlePermissionAdapter(createMockCtor());
      expect(adapter.subscribe).toBeTypeOf("function");
      const listener = vi.fn();
      const dispose = await callSubscribe(adapter, listener);

      await vi.waitFor(() => {
        expect(listener).toHaveBeenCalled();
      });

      listeners[0]?.();
      await vi.waitFor(() => {
        expect(listener.mock.calls.length).toBeGreaterThan(1);
      });

      dispose();
      expect(status.removeEventListener).toHaveBeenCalled();
    });

    it("subscribe returns no-op when query throws", async () => {
      vi.stubGlobal("isSecureContext", true);
      stubNavigator({
        permissions: {
          query: vi.fn().mockRejectedValue(new Error("not supported")),
        },
      });
      const adapter = createIdlePermissionAdapter(createMockCtor());
      expect(adapter.subscribe).toBeTypeOf("function");
      const dispose = await callSubscribe(adapter, vi.fn());
      expect(dispose).toBeInstanceOf(Function);
    });
  });
});
