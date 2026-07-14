import geoPlugin from "@ailuracode/alpine-geo";
import permissionsPlugin, { type PermissionAdapter } from "@ailuracode/alpine-permissions";
import Alpine from "alpinejs";

const geolocationAdapter: PermissionAdapter<"geolocation"> = {
  name: "geolocation",
  requiresUserGesture: true,
  isSupported: () => true,
  getAvailability: () => "available" as const,
  query: async () => "granted" as const,
  request: async () => ({ permission: "granted" as const }),
};

const registerPermissions = permissionsPlugin({ adapters: [geolocationAdapter] });
if (registerPermissions) {
  Alpine.plugin(registerPermissions);
}
Alpine.plugin(geoPlugin());
Alpine.start();
