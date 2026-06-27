---
title: "Geo"
description: "Package: @ailuracode/alpinejs-geo"
---

Package: `@ailuracode/alpinejs-geo`

Reactive geolocation via the `$store.geo` store. Wraps the browser [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) with one-shot requests and continuous position watching.

## Install

```bash
npm install @ailuracode/alpinejs-geo alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import geo from "@ailuracode/alpinejs-geo";

Alpine.plugin(geo);
Alpine.start();
```

## Store API

### State

| Property | Type | Description |
|----------|------|-------------|
| `latitude` | `number \| null` | Last known latitude in decimal degrees |
| `longitude` | `number \| null` | Last known longitude in decimal degrees |
| `accuracy` | `number \| null` | Accuracy radius in meters |
| `altitude` | `number \| null` | Altitude in meters above ellipsoid |
| `altitudeAccuracy` | `number \| null` | Altitude accuracy in meters |
| `heading` | `number \| null` | Direction of travel in degrees |
| `speed` | `number \| null` | Speed in meters per second |
| `timestamp` | `number \| null` | Position timestamp (Unix ms) |
| `error` | `string \| null` | Last error message |
| `errorCode` | `number \| null` | Geolocation error code (`1` denied, `2` unavailable, `3` timeout) |
| `loading` | `boolean` | `true` while a one-shot `request()` is pending |
| `watching` | `boolean` | `true` while `watch()` is active |

### Getters

| Getter | Type | Description |
|--------|------|-------------|
| `hasPosition` | `boolean` | `true` when latitude and longitude are available |
| `isSupported` | `boolean` | `true` when `navigator.geolocation` exists |
| `isWatching` | `boolean` | Alias for `watching` |
| `isLoading` | `boolean` | Alias for `loading` |
| `hasError` | `boolean` | `true` when `error` is set |

### Actions

| Method | Returns | Description |
|--------|---------|-------------|
| `request(options?)` | `Promise<boolean>` | One-shot position via `getCurrentPosition` |
| `watch(options?)` | `boolean` | Start `watchPosition`; returns `false` if unsupported or already watching |
| `unwatch()` | `boolean` | Stop active watch; returns `false` if none is active |
| `reset()` | `boolean` | Clear position and error state without stopping a watch |

All actions accept optional [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions): `enableHighAccuracy`, `timeout`, `maximumAge`.

## HTML examples

```html
<button
  @click="$store.geo.request({ enableHighAccuracy: true })"
  :disabled="!$store.geo.isSupported || $store.geo.isLoading"
>
  Use my location
</button>

<p x-show="$store.geo.hasPosition">
  You are at
  <span x-text="$store.geo.latitude.toFixed(4)"></span>,
  <span x-text="$store.geo.longitude.toFixed(4)"></span>
  (±<span x-text="Math.round($store.geo.accuracy)"></span> m)
</p>

<p x-show="$store.geo.hasError" x-text="$store.geo.error"></p>
```

```html
<button
  x-show="!$store.geo.isWatching"
  @click="$store.geo.watch()"
>
  Start tracking
</button>

<button
  x-show="$store.geo.isWatching"
  @click="$store.geo.unwatch()"
>
  Stop tracking
</button>
```

## Notes

- Requires user permission in secure contexts (HTTPS or localhost)
- `request()` and `watch()` share the same reactive state; a successful update clears the previous error
- `reset()` clears stored coordinates but does not stop an active watch — call `unwatch()` first if needed
- Read-only environment access is not exposed as a magic; use the store for shared state and actions across components
