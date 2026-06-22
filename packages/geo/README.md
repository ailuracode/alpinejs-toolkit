# @ailuracode/alpine-geo

Geolocation store for Alpine.js.

**[Full documentation →](../../docs/geo.md)**

## Install

```bash
npm install @ailuracode/alpine-geo alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import geo from "@ailuracode/alpine-geo";

Alpine.plugin(geo);
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

## License

MIT
