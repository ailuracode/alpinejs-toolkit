# @ailuracode/alpine-permissions

Framework-agnostic browser permission registry with a typed adapter contract.

## Install

```bash
pnpm add @ailuracode/alpine-permissions @ailuracode/alpine-core alpinejs
```

Register only the adapters you need from feature packages such as `@ailuracode/alpine-notify`, `@ailuracode/alpine-geo`, and `@ailuracode/alpine-attention`.

## Quick example

```ts
import Alpine from "alpinejs";
import { permissionsPlugin } from "@ailuracode/alpine-permissions";
import { createNotificationPermissionAdapter } from "@ailuracode/alpine-notify";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";
import { createIdlePermissionAdapter } from "@ailuracode/alpine-attention";

Alpine.plugin(
  permissionsPlugin({
    adapters: [
      createNotificationPermissionAdapter(),
      createGeoPermissionAdapter(),
      createIdlePermissionAdapter(),
    ],
  })
);

Alpine.start();
```

```html
<button @click="await $permissions.request('notifications')">
  Enable notifications
</button>
<p x-text="$permissions.get('notifications')?.permission"></p>
```

## Controller API

```ts
import { createPermissions } from "@ailuracode/alpine-permissions";

const permissions = createPermissions();
const dispose = permissions.register(createGeoPermissionAdapter());

await permissions.query("geolocation");
await permissions.request("geolocation");
permissions.get("geolocation");

dispose();
permissions.destroy();
```

## Store / magic API

`permissionsPlugin()` registers:

- `$store.permissions`
- `$permissions`

Both expose readonly snapshots plus `query()`, `request()`, `refresh()`, `watch()`, and `register()`.

## UX policy

- Never request permission during plugin registration or controller mount.
- Trigger requests only from explicit user actions.
- Do not re-request permissions already reported as denied.
- Distinguish unsupported APIs, insecure contexts, policy blocks, and platform restrictions.
- Keep the app functional when permission is unavailable.

## License

MIT
