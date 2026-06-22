# @ailuracode/alpine-platform

Alpine.js magic for detecting the client's operating system and platform.

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
<p x-show="$platform.isIos">Open from the Home Screen for full support</p>

<p>Platform: <span x-text="$platform.name"></span></p>
```

## Exported helpers

Pure detection functions are exported for use in other packages or tests:

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

Detection uses `navigator.userAgentData.platform` when available, then falls back to `navigator.userAgent` and `navigator.platform`. iPadOS desktop mode is detected via `MacIntel` + `maxTouchPoints > 1`.

## Notes

- Read-only magic — no store
- CSS-framework agnostic
- For viewport breakpoints use `@ailuracode/alpine-screen`; for touch hardware use `@ailuracode/alpine-touch`

## License

MIT
