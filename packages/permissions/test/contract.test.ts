import { afterEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import permissionsPlugin, { createPermissions } from "../src/index.js";
import type { PermissionAdapter } from "../src/types.js";

function createPromptAdapter(name: string): PermissionAdapter<string> {
  return {
    name,
    requiresUserGesture: true,
    isSupported: () => true,
    getAvailability: () => "available",
    query: async () => "prompt",
    request: async () => ({ permission: "granted" }),
  };
}

describe("@ailuracode/alpine-permissions contract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers $store.permissions and syncs query results reactively", async () => {
    const query = vi.fn(async () => "granted" as const);
    const Alpine = startAlpine(
      permissionsPlugin({
        adapters: [{ ...createPromptAdapter("notifications"), query }],
      }) as Parameters<typeof startAlpine>[0]
    );

    const store = Alpine.store("permissions") as import("../src/types.js").PermissionsStore;

    await vi.waitFor(() => {
      expect(query).toHaveBeenCalled();
      expect(store.registry.notifications?.permission).toBe("granted");
    });
  });

  it("never auto-requests during plugin registration", () => {
    const request = vi.fn(async () => ({ permission: "granted" as const }));
    const query = vi.fn(async () => "prompt" as const);
    const controller = createPermissions();
    controller.register({
      ...createPromptAdapter("geolocation"),
      query,
      request,
    });

    startAlpine(
      permissionsPlugin({
        controller,
      }) as Parameters<typeof startAlpine>[0]
    );

    expect(request).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalled();
    controller.destroy();
  });

  it("updates the reactive registry after request()", async () => {
    const Alpine = startAlpine(
      permissionsPlugin({
        adapters: [createPromptAdapter("notifications")],
      }) as Parameters<typeof startAlpine>[0]
    );

    const store = Alpine.store("permissions") as import("../src/types.js").PermissionsStore;

    await store.request("notifications");

    expect(store.registry.notifications?.permission).toBe("granted");
  });

  it("removes permission from registry when unregistered", () => {
    const Alpine = startAlpine(
      permissionsPlugin({
        adapters: [createPromptAdapter("geolocation")],
      }) as Parameters<typeof startAlpine>[0]
    );

    const store = Alpine.store("permissions") as import("../src/types.js").PermissionsStore;

    expect(store.registry.geolocation).toBeDefined();

    const dispose = store.register(createPromptAdapter("camera"));
    expect(store.registry.camera).toBeDefined();

    dispose();
    expect(store.registry.camera).toBeUndefined();
  });

  it("calls Alpine.cleanup when available", () => {
    const cleanup = vi.fn();
    const Alpine = startAlpine();
    (Alpine as unknown as Record<string, unknown>).cleanup = cleanup;

    const register = permissionsPlugin();
    if (register) {
      register(Alpine);
    }

    expect(cleanup).toHaveBeenCalled();
  });
});
