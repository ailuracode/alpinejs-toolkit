# @ailuracode/alpine-geo

Geolocation store for Alpine.js.

**[Full documentation →](../../docs/plugins/geo.md)**

## Install

```bash
pnpm add @ailuracode/alpine-geo alpinejs
```

## Quick example

```ts
import Alpine from "alpinejs";
import { geoPlugin } from "@ailuracode/alpine-geo";

Alpine.plugin(geoPlugin());
Alpine.start();
```

```html
<button @click="$store.geo.request()" :disabled="$store.geo.isLoading">
  Get location
</button>

<p x-show="$store.geo.hasPosition">
  Lat: <span x-text="$store.geo.latitude"></span>,
  Lng: <span x-text="$store.geo.longitude"></span>
</p>

<p x-show="$store.geo.hasError" x-text="$store.geo.error"></p>
```

## API summary

| | |
|-|-|
| **Store** | `$store.geo` |
| **Actions** | `request()`, `watch()`, `unwatch()`, `reset()` |
| **Getters** | `hasPosition`, `isSupported`, `isWatching`, `isLoading`, `hasError` |

## Permission adapter

For the unified registry in `@ailuracode/alpine-permissions`:

```ts
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";

createGeoPermissionAdapter();
// registry key: "geolocation"
```

See [`@ailuracode/alpine-permissions`](../permissions/README.md).

## License

MIT
