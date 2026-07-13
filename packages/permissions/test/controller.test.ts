import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPermissions, type PermissionsController } from "../src/controller.js";
import { PermissionError } from "../src/errors.js";
import type { PermissionAdapter, PermissionListener, PermissionSnapshot } from "../src/types.js";

function createTestAdapter(
  overrides: Partial<PermissionAdapter<"test", string>> = {}
): PermissionAdapter<"test", string> {
  let permission: PermissionSnapshot["permission"] = "prompt";

  return {
    name: "test",
    requiresUserGesture: true,
    isSupported: () => true,
    getAvailability: () => "available",
    query: async () => permission,
    request: () => {
      permission = "granted";
      return Promise.resolve({ permission, result: "ok" });
    },
    subscribe: (listener: PermissionListener<string>) => {
      listener({
        permission,
        availability: "available",
        requestState: "idle",
        canRequest: permission === "prompt",
        requiresUserGesture: true,
        error: null,
        result: null,
      });
      return () => {
        // unsubscribe
      };
    },
    ...overrides,
  };
}

describe("@ailuracode/alpine-permissions", () => {
  describe("PermissionsController", () => {
    let controller: PermissionsController;

    beforeEach(() => {
      controller = createPermissions();
    });

    afterEach(() => {
      controller.destroy();
    });

    it("imports without browser globals", async () => {
      await expect(import("../src/index.js")).resolves.toBeDefined();
    });

    it("registers adapters without side effects", () => {
      const query = vi.fn(async () => "prompt" as const);
      const adapter = createTestAdapter({ query });
      controller.register(adapter);
      expect(query).not.toHaveBeenCalled();
      expect(controller.get("test")?.permission).toBe("unknown");
    });

    it("queries and updates snapshots", async () => {
      controller.register(createTestAdapter());
      const snapshot = await controller.query("test");
      expect(snapshot.permission).toBe("prompt");
      expect(snapshot.availability).toBe("available");
      expect(snapshot.canRequest).toBe(true);
    });

    it("requests permission and stores typed results", async () => {
      controller.register(createTestAdapter());
      const snapshot = await controller.request("test");
      expect(snapshot.permission).toBe("granted");
      expect(snapshot.result).toBe("ok");
    });

    it("deduplicates concurrent requests", async () => {
      let resolveRequest: ((value: { permission: "granted" }) => void) | undefined;
      const request = vi.fn(
        () =>
          new Promise<{ permission: "granted" }>((resolve) => {
            resolveRequest = resolve;
          })
      );

      controller.register(createTestAdapter({ request }));
      const first = controller.request("test");
      const second = controller.request("test");
      expect(request).toHaveBeenCalledTimes(1);

      resolveRequest?.({ permission: "granted" });
      await expect(first).resolves.toMatchObject({ permission: "granted" });
      await expect(second).resolves.toMatchObject({ permission: "granted" });
    });

    it("ignores stale query results", async () => {
      let resolveFirst: ((value: "prompt") => void) | undefined;
      const query = vi
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise<"prompt">((resolve) => {
              resolveFirst = resolve;
            })
        )
        .mockResolvedValueOnce("denied");

      controller.register(createTestAdapter({ query }));
      const first = controller.query("test");
      await controller.query("test");
      resolveFirst?.("prompt");

      const firstSnapshot = await first;
      expect(firstSnapshot.permission).toBe("denied");
    });

    it("does not re-request denied permissions", async () => {
      const request = vi.fn();
      controller.register(
        createTestAdapter({
          query: async () => "denied",
          request,
        })
      );

      await controller.query("test");
      const snapshot = await controller.request("test");
      expect(request).not.toHaveBeenCalled();
      expect(snapshot.permission).toBe("denied");
      expect(snapshot.canRequest).toBe(false);
    });

    it("distinguishes unsupported and insecure contexts", async () => {
      controller.register(
        createTestAdapter({
          isSupported: () => false,
          getAvailability: () => "unsupported",
        })
      );

      const unsupported = await controller.query("test");
      expect(unsupported.availability).toBe("unsupported");
      expect(unsupported.permission).toBe("denied");

      controller.unregister("test");
      controller.register(
        createTestAdapter({
          name: "test",
          isSupported: () => false,
          getAvailability: () => "insecure-context",
        })
      );

      const insecure = await controller.query("test");
      expect(insecure.availability).toBe("insecure-context");
    });

    it("starts subscriptions explicitly via watch()", async () => {
      const subscribe = vi.fn((listener) => {
        listener({
          permission: "prompt",
          availability: "available",
          requestState: "idle",
          canRequest: true,
          requiresUserGesture: true,
          error: null,
          result: null,
        });
        return () => {
          // unsubscribe
        };
      });

      controller.register(createTestAdapter({ subscribe }));
      await controller.watch("test");
      expect(subscribe).toHaveBeenCalledTimes(1);
    });

    it("cleans up on unregister and destroy", async () => {
      const unsubscribe = vi.fn();
      const subscribe = vi.fn(() => unsubscribe);
      const dispose = controller.register(createTestAdapter({ subscribe }));
      await controller.watch("test");

      dispose();
      expect(unsubscribe).toHaveBeenCalled();

      const unsubscribeDestroy = vi.fn();
      controller.register(
        createTestAdapter({
          subscribe: () => unsubscribeDestroy,
        })
      );
      await controller.watch("test");
      controller.destroy();
      expect(unsubscribeDestroy).toHaveBeenCalled();
    });

    it("throws when querying unknown permissions", () => {
      expect(() => controller.query("missing")).toThrow(PermissionError);
    });

    it("supports multiple independent controllers", async () => {
      const first = createPermissions();
      const second = createPermissions();
      first.register(createTestAdapter());
      second.register(createTestAdapter({ query: async () => "denied" }));

      await expect(first.query("test")).resolves.toMatchObject({ permission: "prompt" });
      await expect(second.query("test")).resolves.toMatchObject({ permission: "denied" });

      first.destroy();
      second.destroy();
    });

    it("throws when registering duplicate adapter", () => {
      controller.register(createTestAdapter());
      expect(() => controller.register(createTestAdapter())).toThrow(/already registered/);
    });

    it("throws when registering after destroy", () => {
      controller.destroy();
      expect(() => controller.register(createTestAdapter())).toThrow(/after destroy/);
    });

    it("unregister returns false for unknown adapter", () => {
      expect(controller.unregister("nonexistent")).toBe(false);
    });

    it("defaults requiresUserGesture to true when not specified", () => {
      const adapter: PermissionAdapter<"no-gesture"> = {
        name: "no-gesture",
        isSupported: () => true,
        getAvailability: () => "available",
        query: async () => "prompt",
        request: async () => ({ permission: "granted" as const }),
      };
      controller.register(adapter);
      expect(controller.get("no-gesture")?.requiresUserGesture).toBe(true);
    });

    it("throws when querying after destroy", () => {
      controller.register(createTestAdapter());
      controller.destroy();
      expect(() => controller.query("test")).toThrow(/destroyed/);
    });

    it("request returns denied snapshot when not canRequest and denied", async () => {
      controller.register(
        createTestAdapter({
          query: async () => "denied",
          request: vi.fn(),
        })
      );
      await controller.query("test");
      const snapshot = await controller.request("test");
      expect(snapshot.permission).toBe("denied");
    });

    it("request handles unavailable availability", async () => {
      const adapter = createTestAdapter({
        getAvailability: () => "unsupported",
      });
      controller.register(adapter);
      const snapshot = await controller.request("test");
      expect(snapshot.availability).toBe("unsupported");
      expect(snapshot.permission).toBe("denied");
    });

    it("request handles unsupported adapter", async () => {
      controller.register(
        createTestAdapter({
          isSupported: () => false,
          getAvailability: () => "available",
        })
      );
      const snapshot = await controller.request("test");
      expect(snapshot.availability).toBe("unsupported");
      expect(snapshot.error?.code).toBe("PERMISSION_UNSUPPORTED");
    });

    it("request handles query error", async () => {
      controller.register(
        createTestAdapter({
          query: () => Promise.reject(new Error("query failed")),
        })
      );
      const snapshot = await controller.query("test");
      expect(snapshot.permission).toBe("unknown");
      expect(snapshot.requestState).toBe("failed");
    });

    it("request handles request error", async () => {
      controller.register(
        createTestAdapter({
          request: () => Promise.reject(new Error("request failed")),
        })
      );
      const snapshot = await controller.request("test");
      expect(snapshot.permission).toBe("denied");
      expect(snapshot.requestState).toBe("failed");
      expect(snapshot.error?.message).toBe("request failed");
    });

    it("watch returns existing unsubscribe when already watching", async () => {
      let firstUnsubscribe = false;
      let subscribeCallCount = 0;
      const subscribe = vi.fn(() => {
        subscribeCallCount++;
        return () => {
          firstUnsubscribe = true;
        };
      });
      controller.register(createTestAdapter({ subscribe }));
      const first = await controller.watch("test");
      const second = await controller.watch("test");
      expect(subscribeCallCount).toBe(1);
      expect(second).toBe(first);

      first();
      expect(firstUnsubscribe).toBe(true);
    });

    it("watch returns no-op when adapter has no subscribe", async () => {
      const adapter: PermissionAdapter<"no-sub"> = {
        name: "no-sub",
        isSupported: () => true,
        getAvailability: () => "available",
        query: async () => "prompt",
        request: async () => ({ permission: "granted" as const }),
      };
      controller.register(adapter);
      const dispose = await controller.watch("no-sub");
      expect(dispose).toBeInstanceOf(Function);
    });

    it("getRegistry returns all registered permissions", () => {
      const adapter2: PermissionAdapter<"test2"> = {
        name: "test2",
        isSupported: () => true,
        getAvailability: () => "available",
        query: async () => "prompt",
        request: async () => ({ permission: "granted" as const }),
      };
      controller.register(createTestAdapter());
      controller.register(adapter2);
      const registry = controller.getRegistry();
      expect(Object.keys(registry)).toContain("test");
      expect(Object.keys(registry)).toContain("test2");
    });
  });
});
