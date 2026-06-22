# Platform

Package: `@ailuracode/alpine-platform`

Detects the client's operating system and platform via `$platform` magic.

## Install

```bash
npm install @ailuracode/alpine-platform alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import platform from "@ailuracode/alpine-platform";

Alpine.plugin(platform);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `name` | `"macos" \| "windows" \| "linux" \| "ios" \| "android" \| "chromeos" \| "unknown"` | Resolved platform |
| `isMac` | `boolean` | Desktop macOS |
| `isWindows` | `boolean` | Windows |
| `isLinux` | `boolean` | Desktop Linux |
| `isIos` | `boolean` | iOS / iPadOS |
| `isAndroid` | `boolean` | Android |
| `isChromeos` | `boolean` | ChromeOS |

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
  detectPlatformName,
  isAndroidDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  readPlatformState,
} from "@ailuracode/alpine-platform";
```

`@ailuracode/alpine-notify` uses `isIosDevice()` and `isAndroidDevice()` internally for mobile notification delivery.

## Detection strategy

1. `navigator.userAgentData.platform` (Client Hints) when available
2. `navigator.userAgent` and `navigator.platform`
3. iPadOS desktop mode via `MacIntel` + `maxTouchPoints > 1`

## Use cases

- Show OS-specific keyboard shortcut hints
- Branch install or permission instructions (e.g. iOS Home Screen)
- Complement `@ailuracode/alpine-screen` (viewport) and `@ailuracode/alpine-touch` (pointer)

## Notes

- Read-only magic — no store
- CSS-framework agnostic
- Platform is resolved once at plugin load (static for the session)
