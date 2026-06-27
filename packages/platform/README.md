# @ailuracode/alpinejs-platform

Alpine.js magic for detecting the client's operating system and platform.

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
| `is(platform)` | `boolean` | Platform name check |

## HTML examples

```html
<p x-show="$platform.isMac">Use ⌘ shortcuts</p>
<p x-show="$platform.isWindows">Use Ctrl shortcuts</p>
<p x-show="$platform.isIos">Open from the Home Screen for full support</p>

<p>Platform: <span x-text="$platform.name"></span></p>
```

## Exported helpers

Pure detection functions are exported for use in other packages or tests:

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

Detection uses `navigator.userAgentData.platform` when available, then falls back to `navigator.userAgent` and `navigator.platform`. iPadOS desktop mode is detected via `MacIntel` + `maxTouchPoints > 1`.

## Notes

- Read-only magic — no store
- CSS-framework agnostic
- For viewport breakpoints use `@ailuracode/alpinejs-screen`; for touch hardware use `@ailuracode/alpinejs-touch`

## License

MIT
