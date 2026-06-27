---
title: "Platform"
description: "Package: @ailuracode/alpinejs-platform"
---

Package: `@ailuracode/alpinejs-platform`

Detects the client's operating system and platform via `$platform` magic.

## Install

```bash
npm install @ailuracode/alpinejs-platform alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import platform from "@ailuracode/alpinejs-platform";

Alpine.plugin(platform);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `name` | `PlatformName` (getter) | Resolved platform |
| `isMac` | `boolean` (getter) | Desktop macOS |
| `isWindows` | `boolean` (getter) | Windows |
| `isLinux` | `boolean` (getter) | Desktop Linux |
| `isIos` | `boolean` (getter) | iOS / iPadOS |
| `isAndroid` | `boolean` (getter) | Android |
| `isChromeos` | `boolean` (getter) | ChromeOS |
| `is(platform)` | `boolean` | `true` when `name` matches the given platform |

## HTML examples

```html
<p x-show="$platform.isMac">Use ⌘ shortcuts</p>
<p x-show="$platform.isWindows">Use Ctrl shortcuts</p>
<p x-show="$platform.isIos">iOS-specific instructions</p>

<p>Platform: <span x-text="$platform.name"></span></p>
```

## Exported helpers

Pure detection functions are exported for reuse in other packages:

```js
import {
  PLATFORM_NAMES,
  createPlatformState,
  detectPlatformName,
  isAndroidDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  platformFlags,
  readPlatformState,
} from "@ailuracode/alpinejs-platform";
```

`@ailuracode/alpinejs-notify` uses `isIosDevice()` and `isAndroidDevice()` internally for mobile notification delivery.

## Detection strategy

1. `navigator.userAgentData.platform` (Client Hints) when available
2. `navigator.userAgent` and `navigator.platform`
3. iPadOS desktop mode via `MacIntel` + `maxTouchPoints > 1`

## Use cases

- Show OS-specific keyboard shortcut hints
- Branch install or permission instructions (e.g. iOS Home Screen)
- Complement `@ailuracode/alpinejs-screen` (viewport) and `@ailuracode/alpinejs-touch` (pointer)

## Notes

- Read-only magic — no store
- CSS-framework agnostic
- Platform is resolved once at plugin load (static for the session)
