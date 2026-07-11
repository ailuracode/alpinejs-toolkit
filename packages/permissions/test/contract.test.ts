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

  it("registers $store.permissions and $permissions", () => {
    const Alpine = startAlpine(
      permissionsPlugin({
        adapters: [createPromptAdapter("notifications")],
      }) as Parameters<typeof startAlpine>[0]
    );

    const store = Alpine.store("permissions") as import("../src/types.js").PermissionsStore;
    expect(store.get("notifications")?.permission).toBe("unknown");
    expect(store.query).toBeTypeOf("function");
  });

  it("never auto-requests during plugin registration", () => {
    const request = vi.fn(async () => ({ permission: "granted" as const }));
    const controller = createPermissions();
    controller.register({
      ...createPromptAdapter("geolocation"),
      request,
    });

    startAlpine(
      permissionsPlugin({
        controller,
      }) as Parameters<typeof startAlpine>[0]
    );

    expect(request).not.toHaveBeenCalled();
    controller.destroy();
  });
});
