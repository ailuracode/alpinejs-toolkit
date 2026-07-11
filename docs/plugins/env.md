---
title: "Env"
description: "Package: @ailuracode/alpine-env"
---

Package: `@ailuracode/alpine-env`

Browser environment magics in one package: connectivity, tab visibility, battery, and platform detection.

Under the hood, each magic is backed by a lifecycle-aware headless controller. Alpine only mirrors readonly snapshots into reactivity.

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
| `isAvailable` | `boolean` | Battery Status API available in this browser |
| `level` | `number \| null` | Charge level 0–1 |
| `isCharging` | `boolean` | Whether the device is charging |
| `chargingTime` | `number \| null` | Seconds until charged (`null` when unknown) |
| `dischargingTime` | `number \| null` | Seconds until empty (`null` when unknown) |

```html
<span x-text="`${Math.round(($battery.level ?? 0) * 100)}%`"></span>
```

## `$platform`

Operating system and device flags from `navigator.userAgent` and related signals.

| Property | Type | Description |
|----------|------|-------------|
| `name` | `PlatformName` | `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`, `"chromeos"`, or `"unknown"` |
| `isMac` | `boolean` | macOS |
| `isWindows` | `boolean` | Windows |
| `isLinux` | `boolean` | Linux desktop |
| `isIos` | `boolean` | iOS (including iPadOS) |
| `isAndroid` | `boolean` | Android |
| `isChromeos` | `boolean` | ChromeOS |
| `is(platform)` | `(platform) => boolean` | Compare against the detected platform |

```html
<button x-show="$platform.isIos">Install on Home Screen</button>
```

See [Device detection](../device-detection.md) for when to use `env` vs `media`.

## Headless controllers

Use the controllers directly when you want lifecycle-managed environment state without Alpine:

```js
import {
  createBattery,
  createNetwork,
  createPlatform,
  createVisibility,
} from "@ailuracode/alpine-env";

const network = createNetwork();
network.on("change", (detail) => {
  console.log(detail.isOnline);
});
```

Controllers are SSR-safe to construct, start subscriptions in `mount()`, and remove listeners on `destroy()`.

The Alpine-only shorthands still exist as aliases: `networkPlugin`, `visibilityPlugin`, `batteryPlugin`, `platformPlugin`.

## Utilities

| Function | Description |
|----------|-------------|
| `readPlatformState()` | Snapshot of platform flags |
| `detectPlatformName()` | OS name without Alpine |
| `isIosDevice()` / `isAndroidDevice()` | Device helpers (used by `@ailuracode/alpine-notify`) |
