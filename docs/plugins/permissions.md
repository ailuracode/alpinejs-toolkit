---
title: Permissions
description: Unified browser permission registry with adapter contract
---

Package: `@ailuracode/alpine-permissions`

Normalizes browser permission state across toolkit capabilities. Feature packages export capability-specific adapters; the application registers only the adapters it needs.

## Install

```bash
pnpm add @ailuracode/alpine-permissions @ailuracode/alpine-core alpinejs
```

Also install adapters from the capabilities you use:

```bash
pnpm add @ailuracode/alpine-notify @ailuracode/alpine-geo @ailuracode/alpine-attention
```

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

## Store / magic API

Both `$store.permissions` and `$permissions` return the same reactive store.

### Snapshot shape

Each entry in `registry` is a `PermissionSnapshot`:

| Field | Values | Description |
|-------|--------|-------------|
| `permission` | `granted`, `prompt`, `denied`, `unknown` | Normalized permission state |
| `availability` | `available`, `unsupported`, `insecure-context`, `policy-blocked`, `platform-restricted` | Technical availability |
| `requestState` | `idle`, `requesting`, `succeeded`, `failed` | In-flight request lifecycle |
| `canRequest` | `boolean` | Whether `request()` may be called |
| `requiresUserGesture` | `boolean` | Browser expects a user gesture |
| `error` | `PermissionError \| null` | Last structured error |
| `result` | capability-specific | Optional typed result from `request()` |

### Methods

| Method | Description |
|--------|-------------|
| `registry` | Readonly map of snapshots keyed by adapter name |
| `get(name)` | `registry[name]` |
| `query(name)` | Refresh from the browser without prompting |
| `request(name, options?)` | Prompt when `canRequest` is true |
| `refresh(name)` | Alias for `query(name)` |
| `watch(name)` | Observe `PermissionStatus.change` when supported |
| `register(adapter)` | Register an adapter at runtime; returns a disposer |

### Template binding

Bind to **`registry`** so Alpine re-renders when permission state changes:

```html
<p x-text="$permissions.registry.notifications?.permission"></p>

<button
  x-show="$permissions.registry.geolocation?.canRequest"
  @click="await $permissions.request('geolocation')"
>
  Share location
</button>
```

Avoid reading snapshots only through `get()` in templates — prefer `registry[name]` for reactivity.

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

## Feature adapters

| Package | Factory | Name constant | Permission name |
|---------|---------|---------------|-----------------|
| `@ailuracode/alpine-notify` | `createNotificationPermissionAdapter(options?)` | `NOTIFICATION_PERMISSION_NAME` | `notifications` |
| `@ailuracode/alpine-geo` | `createGeoPermissionAdapter()` | `GEOLOCATION_PERMISSION_NAME` | `geolocation` |
| `@ailuracode/alpine-attention` | `createIdlePermissionAdapter()` | `IDLE_PERMISSION_NAME` | `idle-detection` |

Adapters live in feature packages so tree-shaking and dependency direction stay clean:

```text
alpine-core → alpine-permissions → geo / notify / attention
```

## UX policy

1. Never request permission during plugin registration or controller mount.
2. `query()` and `watch()` on init are allowed — they do not prompt.
3. `request()` must come from an explicit user action when `requiresUserGesture` applies.
4. Explain the benefit before triggering the browser prompt.
5. Do not re-request permissions already reported as denied.
6. Distinguish unsupported APIs, insecure contexts, Permissions Policy blocks, and platform restrictions.
7. Observe permission revocation when the browser exposes `PermissionStatus.change`.
8. Keep the application functional when permission is unavailable or denied.

## Relationship to feature plugins

`$notify`, `$store.geo`, and `$idle` keep their existing APIs. Use `$permissions` when you need a single registry across capabilities or normalized availability metadata.

- **Notify** — `createNotificationPermissionAdapter()` wraps `Notification.permission` and `requestPermission()`.
- **Geo** — `createGeoPermissionAdapter()` uses the Permissions API and geolocation prompt semantics.
- **Attention** — `createIdlePermissionAdapter()` covers idle-detection permission; `IdleController` uses the same adapter internally.
