import permissionsPlugin, { type PermissionAdapter } from "@ailuracode/alpine-permissions";
import Alpine from "alpinejs";

const notificationsAdapter: PermissionAdapter<"notifications"> = {
  name: "notifications",
  requiresUserGesture: true,
  isSupported: () => true,
  getAvailability: () => "available" as const,
  query: async () => "prompt" as const,
  request: async () => ({ permission: "granted" as const }),
};

const registerPermissions = permissionsPlugin({ adapters: [notificationsAdapter] });
if (registerPermissions) {
  Alpine.plugin(registerPermissions);
}
Alpine.start();
