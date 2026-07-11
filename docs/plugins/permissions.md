---
title: Permissions
description: Unified browser permission registry with adapter contract
---

`@ailuracode/alpine-permissions` normalizes browser permission state while feature packages provide capability-specific adapters.

## Install

```bash
pnpm add @ailuracode/alpine-permissions @ailuracode/alpine-core alpinejs
```

Register adapters only for installed capabilities:

```ts
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
```

## UX policy

1. Never request permission during plugin registration or controller mount.
2. Requests must come from explicit user actions.
3. Explain the benefit before prompting.
4. Do not re-request denied permissions.
5. Distinguish unsupported APIs, insecure contexts, policy blocks, and platform restrictions.
6. Observe permission revocation when the browser exposes `PermissionStatus.change`.
7. Keep the app functional when permission is unavailable.

## API

- `$store.permissions` / `$permissions` — registry snapshots and commands
- `PermissionsController` — framework-agnostic headless registry
- Feature adapters — `createNotificationPermissionAdapter()`, `createGeoPermissionAdapter()`, `createIdlePermissionAdapter()`
