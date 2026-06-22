# Notify

Package: `@ailuracode/alpine-notify`

Thin wrapper around the [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) via the `$notify` magic. Handles unsupported browsers and permission states without throwing.

## Install

```bash
npm install @ailuracode/alpine-notify alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import notify from "@ailuracode/alpine-notify";

Alpine.plugin(notify);
Alpine.start();
```

## Magic API

| Method | Type | Description |
|--------|------|-------------|
| `isSupported()` | `boolean` | `true` when `Notification` is available |
| `permission()` | `NotificationPermission` | `granted`, `denied`, or `default` |
| `requestPermission()` | `Promise<NotificationPermission>` | Prompts the user when permission is `default` |
| `send(title, options?)` | `Notification \| null` | Creates a notification when permission is `granted` |
| `sendIfPermitted(title, options?)` | `Notification \| null` | Same as `send` — explicit intent in templates |
| `close(notification)` | `void` | Closes a notification safely |

All methods except `requestPermission()` are synchronous. Nothing throws when notifications are unavailable.

## Usage examples

### Simple notification

```js
$notify.send("Hello");
```

### With options

```js
$notify.send("Order completed", {
  body: "Your payment was successful.",
  icon: "/logo.png",
});
```

### Request permission first

```html
<button
  x-show="$notify.isSupported() && $notify.permission() === 'default'"
  @click="await $notify.requestPermission()"
>
  Enable notifications
</button>
```

```js
await $notify.requestPermission();
$notify.send("You are subscribed");
```

### Only notify when already allowed

```js
$notify.sendIfPermitted("Background job finished");
```

### Close programmatically

```html
<div
  x-data="{ note: null }"
  @job-complete.window="note = $notify.sendIfPermitted('Done')"
>
  <button x-show="note" @click="$notify.close(note); note = null">
    Dismiss
  </button>
</div>
```

### Feature detection in templates

```html
<div x-show="!$notify.isSupported()">
  Notifications are not supported in this browser.
</div>

<div x-show="$notify.permission() === 'denied'">
  Notifications are blocked. Enable them in browser settings.
</div>
```

## Behavior

- **Unsupported browsers** — `isSupported()` is `false`, `permission()` returns `denied`, `send` / `sendIfPermitted` return `null`.
- **Denied permission** — `Notification` is never constructed; methods return `null` or `denied` without throwing.
- **Default permission** — `send` returns `null` until the user grants access via `requestPermission()`.
- **Granted permission** — `send` and `sendIfPermitted` create and return a `Notification` instance.

The plugin does not render UI, manage toast stacks, or persist preferences. Use your own components for in-app messaging and permission UX.

## Browser compatibility

| Environment | Notes |
|-------------|-------|
| Chrome, Edge, Opera | Supported in secure contexts |
| Firefox | Supported in secure contexts |
| Safari (macOS 16.4+) | Supported |
| Safari (iOS / iPadOS) | Web Notifications are not available to pages; use native apps or in-app UI |
| HTTP (non-localhost) | Blocked — requires HTTPS |
| Web Workers / Service Workers | This plugin targets `window` / Alpine templates in the main document |

Always check `isSupported()` and `permission()` before showing permission prompts or assuming notifications will appear.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-notify" />
```

Or import the plugin module:

```ts
import notify from "@ailuracode/alpine-notify";
```

Individual helpers are also exported for non-Alpine use:

```ts
import {
  createNotifyMagic,
  isNotifySupported,
  sendNotification,
} from "@ailuracode/alpine-notify";
```

## Design notes

- **Magic, not store** — notifications are one-off actions, not shared reactive state.
- **Fail silent** — returning `null` keeps Alpine expressions and event handlers simple.
- **No UI coupling** — framework-agnostic; pair with your own toast or banner components for in-page feedback.
