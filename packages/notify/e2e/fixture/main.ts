import notifyPlugin from "@ailuracode/alpine-notify";
import permissionsPlugin, { type PermissionAdapter } from "@ailuracode/alpine-permissions";
import Alpine from "alpinejs";

const notificationsAdapter: PermissionAdapter<"notifications"> = {
  name: "notifications",
  requiresUserGesture: true,
  isSupported: () => true,
  getAvailability: () => "available" as const,
  query: async () => "granted" as const,
  request: async () => ({ permission: "granted" as const }),
};

const registerPermissions = permissionsPlugin({ adapters: [notificationsAdapter] });
if (registerPermissions) {
  Alpine.plugin(registerPermissions);
}

const registerNotify = notifyPlugin();
if (registerNotify) {
  Alpine.plugin(registerNotify);
}
Alpine.start();
