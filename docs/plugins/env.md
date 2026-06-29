---
title: "Env"
description: "Package: @ailuracode/alpine-env"
---

Package: `@ailuracode/alpine-env`

Browser environment magics in one package: connectivity, tab visibility, battery, and platform detection.

## Magics

| Magic | Description |
|-------|-------------|
| `$network` | Online / offline state |
| `$visibility` | Tab visibility (Page Visibility API) |
| `$battery` | Battery level and charging |
| `$platform` | OS and device detection |

## Install

```bash
npm install @ailuracode/alpine-env alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import env from "@ailuracode/alpine-env";

Alpine.plugin(env());
Alpine.start();
```

## Selective registration

```js
Alpine.plugin(env({ battery: false, visibility: false }));
```

## `$network`

Reactive connectivity from `navigator.onLine`.

| Property | Type | Description |
|----------|------|-------------|
| `isOnline` | `boolean` | `true` when online |
| `isOffline` | `boolean` | `true` when offline |

```html
<div x-show="$network.isOffline">You are offline</div>
```

## `$visibility`

Reactive tab visibility from the Page Visibility API.

| Property / method | Type | Description |
|-------------------|------|-------------|
| `isVisible` | `boolean` | Tab is visible |
| `isHidden` | `boolean` | Tab is hidden |
| `state` | `"visible" \| "hidden" \| "prerender"` | Raw visibility state |
| `is(state)` | `(state) => boolean` | Compare current state |

```html
<div x-show="$visibility.isHidden">Tab is in the background</div>
```

`$visibility` is registered by [`@ailuracode/alpine-env`](./env.md). Pair with [`@ailuracode/alpine-attention`](./attention.md) when you also need wake lock or idle detection.

## `$battery`

Reactive battery status when the Battery Status API is available.

| Property | Type | Description |
|----------|------|-------------|
| `level` | `number \| null` | Charge level 0–1 |
| `charging` | `boolean \| null` | Whether the device is charging |
| `supported` | `boolean` | API available in this browser |

```html
<span x-text="`${Math.round(($battery.level ?? 0) * 100)}%`"></span>
```

## `$platform`

Operating system and device flags from `navigator.userAgent` and related signals.

| Property | Type | Description |
|----------|------|-------------|
| `name` | `PlatformName` | `"mac"`, `"windows"`, `"ios"`, `"android"`, etc. |
| `isMac` | `boolean` | macOS |
| `isWindows` | `boolean` | Windows |
| `isIos` | `boolean` | iOS (including iPadOS) |
| `isAndroid` | `boolean` | Android |
| `isLinux` | `boolean` | Linux desktop |
| `isChromeOs` | `boolean` | ChromeOS |

```html
<button x-show="$platform.isIos">Install on Home Screen</button>
```

See [Device detection](../device-detection.md) for when to use `env` vs `media`.

## Standalone registration

Register individual magics without the full plugin:

```js
import {
  registerNetworkMagic,
  registerVisibilityMagic,
  registerBatteryMagic,
  registerPlatformMagic,
} from "@ailuracode/alpine-env";

registerNetworkMagic(Alpine);
```

Aliases: `networkPlugin`, `visibilityPlugin`, `batteryPlugin`, `platformPlugin`.

## Utilities

| Function | Description |
|----------|-------------|
| `readNetworkState()` | Snapshot of connectivity |
| `readVisibilityState(doc?)` | Snapshot of tab visibility |
| `readBatteryState()` | Snapshot of battery |
| `readPlatformState()` / `createPlatformState()` | Snapshot of platform flags |
| `detectPlatformName()` | OS name without Alpine |
| `isIosDevice()` / `isAndroidDevice()` | Device helpers (used by `@ailuracode/alpine-notify`) |
