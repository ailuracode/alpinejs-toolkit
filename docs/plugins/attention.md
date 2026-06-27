---
title: "Attention"
description: "Package: @ailuracode/alpinejs-attention"
---

Package: `@ailuracode/alpinejs-attention`

Reactive Screen Wake Lock and Idle Detection via the `$wakelock` and `$idle` magics. Wraps the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) and [Idle Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Idle_Detection_API) when available.

## Install

```bash
npm install @ailuracode/alpinejs-attention alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import attention from "@ailuracode/alpinejs-attention";

Alpine.plugin(attention);
Alpine.start();
```

## `$wakelock` magic

| Property / method | Type | Description |
|-----------------|------|-------------|
| `isSupported` | `boolean` | `true` when `navigator.wakeLock` is available |
| `isActive` | `boolean` | `true` while a screen wake lock is held |
| `isRequesting` | `boolean` | `true` while `request()` is in progress |
| `error` | `string \| null` | Last error message, if any |
| `request()` | `() => Promise<boolean>` | Acquire a screen wake lock |
| `release()` | `() => Promise<boolean>` | Release the current wake lock |

The plugin re-acquires the wake lock when the tab becomes visible again if you previously called `request()` and have not called `release()`.

## `$idle` magic

| Property / method | Type | Description |
|-----------------|------|-------------|
| `isSupported` | `boolean` | `true` when `IdleDetector` is available |
| `isWatching` | `boolean` | `true` while idle detection is running |
| `isLoading` | `boolean` | `true` while `start()` is in progress |
| `isActive` | `boolean` | `true` when the user is active |
| `isIdle` | `boolean` | `true` when the user is idle |
| `userState` | `'active' \| 'idle' \| null` | Current user idle state |
| `screenState` | `'locked' \| 'unlocked' \| null` | Current screen lock state |
| `permission` | `PermissionState \| null` | Last known idle-detection permission |
| `threshold` | `number` | Idle threshold in milliseconds (default and minimum `60000`) |
| `error` | `string \| null` | Last error message, if any |
| `requestPermission()` | `() => Promise<PermissionState>` | Prompt for idle-detection permission |
| `start(options?)` | `(options?: { threshold?: number }) => Promise<boolean>` | Start idle detection |
| `stop()` | `() => boolean` | Stop idle detection |

## HTML examples

```html
<section x-data>
  <p x-show="!$wakelock.isSupported">Wake Lock is not supported here.</p>
  <button
    type="button"
    x-show="$wakelock.isSupported"
    @click="$wakelock.isActive ? $wakelock.release() : $wakelock.request()"
    x-text="$wakelock.isActive ? 'Allow sleep' : 'Keep screen awake'"
  ></button>
</section>

<section x-data>
  <p x-show="!$idle.isSupported">Idle Detection is not supported here.</p>
  <button
    type="button"
    x-show="$idle.isSupported && !$idle.isWatching"
    @click="$idle.start()"
  >
    Start idle detection
  </button>
  <p x-show="$idle.isWatching">
    User: <strong x-text="$idle.userState"></strong> ·
    Screen: <strong x-text="$idle.screenState"></strong>
  </p>
  <p x-show="$idle.isIdle" class="hint">User went idle — pause expensive work.</p>
</section>
```

## Notes

- Both APIs require a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS or localhost)
- Idle Detection requires explicit permission via `requestPermission()` or `start()`
- The idle threshold must be at least **1 minute** (`60000` ms); lower values are clamped automatically
- Wake locks are released automatically when the tab is hidden; the plugin re-requests them on return when appropriate
- Browser support is limited — always check `isSupported` before calling actions
- Read-only environment state with imperative methods — no store, no persistence
