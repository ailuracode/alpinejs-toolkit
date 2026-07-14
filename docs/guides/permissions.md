---
title: Permissions composition
description: Compose the permissions registry with notify, geo, and attention capability adapters.
---

The Permissions family combines one foundation registry with optional capability packages. Each capability keeps its own npm package and API, while adapters let you coordinate permission state through `$permissions`.

## When to use what

| Need | Package | Surface |
|------|---------|---------|
| Unified registry across capabilities | `@ailuracode/alpine-permissions` | `$permissions` / `$store.permissions` |
| Browser notifications | `@ailuracode/alpine-notify` | `$notify` |
| Geolocation | `@ailuracode/alpine-geo` | `$store.geo` |
| Wake lock and idle detection | `@ailuracode/alpine-attention` | `$wakelock`, `$idle` |

Use the feature API directly when you only need one capability. Register the matching adapter when you want normalized permission snapshots, availability metadata, and a single registry in templates.

## Recommended setup

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
```

Register only the adapters you need. The registry queries current permission on init and watches revocations — it never opens native prompts automatically.

## UX rules

1. Call `request()` only from explicit user actions.
2. Explain why permission is needed before prompting.
3. Treat unsupported, insecure-context, denied, and platform-restricted states as normal UI branches.
4. Bind templates to `$permissions.registry.<name>` for reactive snapshots.

## Related demos

- [Permissions family playground](/playground/browser-capabilities/permissions/)
- [Permissions package](/plugins/permissions/)
- [Notify](/plugins/notify/) · [Geo](/plugins/geo/) · [Attention](/plugins/attention/)
