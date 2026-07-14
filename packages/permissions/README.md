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
<button
  x-show="$permissions.registry.notifications?.canRequest"
  @click="await $permissions.request('notifications')"
>
  Enable notifications
</button>
<p x-text="$permissions.registry.notifications?.permission"></p>
```

On plugin registration the registry **queries** current browser permission for each adapter and starts **watching** revocations. Native prompts are never shown automatically.

## Store / magic API

`permissionsPlugin()` registers `$store.permissions` and `$permissions` (same reactive object).

| Member | Description |
|--------|-------------|
| `registry` | Readonly map of capability name → `PermissionSnapshot` |
| `get(name)` | Same as `registry[name]` |
| `query(name)` | Refresh permission from the browser (no prompt) |
| `request(name, options?)` | Request permission when `canRequest` is true |
| `refresh(name)` | Alias for `query(name)` |
| `watch(name)` | Subscribe to `PermissionStatus.change` when supported |
| `register(adapter)` | Register an adapter at runtime |

Bind templates to **`$permissions.registry.<name>`** so Alpine re-renders when snapshots change.

## Controller API

```ts
import { createPermissions } from "@ailuracode/alpine-permissions";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";

const permissions = createPermissions();
const dispose = permissions.register(createGeoPermissionAdapter());

await permissions.query("geolocation");
await permissions.request("geolocation");
permissions.get("geolocation");

dispose();
permissions.destroy();
```

## Feature adapters

| Package | Factory | Permission name |
|---------|---------|-----------------|
| `@ailuracode/alpine-notify` | `createNotificationPermissionAdapter(options?)` | `notifications` |
| `@ailuracode/alpine-geo` | `createGeoPermissionAdapter()` | `geolocation` |
| `@ailuracode/alpine-attention` | `createIdlePermissionAdapter()` | `idle-detection` |

## UX policy

- Never request permission during plugin registration or controller mount.
- `query()` and `watch()` run on plugin init — they do not prompt.
- Trigger `request()` only from explicit user actions.
- Do not re-request permissions already reported as denied.
- Distinguish unsupported APIs, insecure contexts, policy blocks, and platform restrictions.

## Setup

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

When the plugin registers, it **queries** each adapter for the current permission and starts **watching** for revocations. This never opens a native prompt.

## Headless controller

```ts
import { createPermissions } from "@ailuracode/alpine-permissions";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";

const permissions = createPermissions();
const dispose = permissions.register(createGeoPermissionAdapter());

await permissions.query("geolocation");
await permissions.request("geolocation");

dispose();
permissions.destroy();
```

`PermissionsController` is framework-agnostic. Alpine integration is optional.

## Relationship to feature plugins

`$notify`, `$store.geo`, and `$idle` keep their existing APIs. Use `$permissions` when you need a single registry across capabilities or normalized availability metadata.

- **Notify** — `createNotificationPermissionAdapter()` wraps `Notification.permission` and `requestPermission()`.
- **Geo** — `createGeoPermissionAdapter()` uses the Permissions API and geolocation prompt semantics.
- **Attention** — `createIdlePermissionAdapter()` covers idle-detection permission; `IdleController` uses the same adapter internally.

## License

MIT
