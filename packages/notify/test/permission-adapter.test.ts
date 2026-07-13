import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as controller from "../src/controller.js";
import {
  createNotificationPermissionAdapter,
  NOTIFICATION_PERMISSION_NAME,
} from "../src/permission-adapter.js";

describe("@ailuracode/alpine-notify/permission-adapter", () => {
  let originalIsSecureContext: unknown;
  let originalNavigator: unknown;

  beforeEach(() => {
    originalIsSecureContext = (globalThis as Record<string, unknown>).isSecureContext;
    originalNavigator = (globalThis as Record<string, unknown>).navigator;
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).isSecureContext = originalIsSecureContext;
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe("createNotificationPermissionAdapter", () => {
    it("exports NOTIFICATION_PERMISSION_NAME", () => {
      expect(NOTIFICATION_PERMISSION_NAME).toBe("notifications");
    });

    it("returns insecure-context when not in secure context", () => {
      (globalThis as Record<string, unknown>).isSecureContext = false;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      const adapter = createNotificationPermissionAdapter();
      expect(adapter.getAvailability()).toBe("insecure-context");
    });

    it("returns platform-restricted when requires home screen install", () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(true);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      const adapter = createNotificationPermissionAdapter();
      expect(adapter.getAvailability()).toBe("platform-restricted");
    });

    it("returns unsupported when notify not supported", () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(false);
      const adapter = createNotificationPermissionAdapter();
      expect(adapter.getAvailability()).toBe("unsupported");
    });

    it("returns available when supported", () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      const adapter = createNotificationPermissionAdapter();
      expect(adapter.getAvailability()).toBe("available");
      expect(adapter.isSupported()).toBe(true);
    });

    it("query returns granted when permission is granted", async () => {
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("granted");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("granted");
    });

    it("query returns denied when permission is denied", async () => {
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("denied");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("denied");
    });

    it("query returns prompt when permission is default", async () => {
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("default");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("prompt");
    });

    it("query returns unknown for invalid permission", async () => {
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue(
        "invalid" as unknown as ReturnType<typeof controller.getNotifyPermission>
      );
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.query();
      expect(result).toBe("unknown");
    });

    it("request returns insecure-context error", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = false;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_INSECURE_CONTEXT");
    });

    it("request returns platform-restricted error", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(true);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_PLATFORM_RESTRICTED");
    });

    it("request returns unsupported error", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(false);
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_UNSUPPORTED");
    });

    it("request returns granted when already granted", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("granted");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("granted");
    });

    it("request returns denied when already denied", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("denied");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
    });

    it("request prompts and returns granted", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("default");
      vi.spyOn(controller, "requestNotifyPermission").mockResolvedValue("granted");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("granted");
    });

    it("request prompts and returns denied", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("default");
      vi.spyOn(controller, "requestNotifyPermission").mockResolvedValue("denied");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("denied");
      expect(result.error?.code).toBe("PERMISSION_DENIED");
    });

    it("request prompts and returns default/prompt", async () => {
      (globalThis as Record<string, unknown>).isSecureContext = true;
      vi.spyOn(controller, "requiresHomeScreenInstall").mockReturnValue(false);
      vi.spyOn(controller, "isNotifySupported").mockReturnValue(true);
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("default");
      vi.spyOn(controller, "requestNotifyPermission").mockResolvedValue("default");
      const adapter = createNotificationPermissionAdapter();
      const result = await adapter.request();
      expect(result.permission).toBe("prompt");
    });

    it("subscribe returns no-op when navigator undefined", async () => {
      const originalNav = (globalThis as Record<string, unknown>).navigator;
      Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
      const adapter = createNotificationPermissionAdapter();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(vi.fn());
        expect(dispose).toBeInstanceOf(Function);
      }
      Object.defineProperty(globalThis, "navigator", { value: originalNav, configurable: true });
    });

    it("subscribe returns no-op when permissions.query missing", async () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {},
        configurable: true,
      });
      const adapter = createNotificationPermissionAdapter();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(vi.fn());
        expect(dispose).toBeInstanceOf(Function);
      }
    });

    it("subscribe notifies listener and cleans up", async () => {
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
          permissions: { query: vi.fn().mockResolvedValue(status) },
        },
        configurable: true,
      });
      vi.spyOn(controller, "getNotifyPermission").mockReturnValue("granted");
      const adapter = createNotificationPermissionAdapter();
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
      Object.defineProperty(globalThis, "navigator", {
        value: {
          permissions: { query: vi.fn().mockRejectedValue(new Error("not supported")) },
        },
        configurable: true,
      });
      const adapter = createNotificationPermissionAdapter();
      if (adapter.subscribe) {
        const dispose = await adapter.subscribe(vi.fn());
        expect(dispose).toBeInstanceOf(Function);
      }
    });
  });
});
