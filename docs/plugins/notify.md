---
title: "Notify"
description: "Package: @ailuracode/alpinejs-notify"
---

Package: `@ailuracode/alpinejs-notify`

Thin wrapper around the [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) via the `$notify` magic. Handles unsupported browsers and permission states without throwing.

## Install

```bash
npm install @ailuracode/alpinejs-notify alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import notify from "@ailuracode/alpinejs-notify";

Alpine.plugin(notify);
Alpine.start();
```

Copy the bundled service worker to your site root (or another same-origin path):

```bash
cp node_modules/@ailuracode/alpinejs-notify/dist/notify-sw.js public/notify-sw.js
```

The plugin registers `/notify-sw.js` automatically. Use a custom path when needed:

```js
Alpine.plugin(
  notify({
    serviceWorkerUrl: "/assets/notify-sw.js",
  }),
);
```

## Magic API

| Member | Type | Description |
|--------|------|-------------|
| `isSupported` | `boolean` (getter) | `true` when notifications can be shown in this environment |
| `requiresHomeScreenInstall` | `boolean` (getter) | `true` on iOS/iPadOS Safari tabs that need a Home Screen install |
| `permission` | `NotificationPermission` (getter) | `granted`, `denied`, or `default` |
| `requestPermission()` | `Promise<NotificationPermission>` | Prompts the user when permission is `default` |
| `send(title, options?)` | `Notification \| null` | Creates a desktop notification synchronously |
| `sendAsync(title, options?)` | `Promise<Notification \| null>` | Preferred on mobile; uses a service worker when needed |
| `sendIfPermitted(title, options?)` | `Notification \| null` | Same as `send` — explicit intent in templates |
| `sendIfPermittedAsync(title, options?)` | `Promise<Notification \| null>` | Same as `sendAsync` |
| `close(notification)` | `void` | Closes a notification safely |

Use getters without parentheses in templates: `$notify.isSupported`, `$notify.permission`.

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
  x-show="$notify.isSupported && $notify.permission === 'default'"
  @click="await $notify.requestPermission()"
>
  Enable notifications
</button>
```

```js
await $notify.requestPermission();
await $notify.sendAsync("You are subscribed");
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
<div x-show="!$notify.isSupported && !$notify.requiresHomeScreenInstall">
  Notifications are not supported in this browser.
</div>

<div x-show="$notify.requiresHomeScreenInstall">
  Add this site to your Home Screen on iPhone or iPad to enable notifications.
</div>

<div x-show="$notify.isSupported && $notify.permission === 'denied'">
  Notifications are blocked. Enable them in browser settings.
</div>
```

## Behavior

- **Unsupported browsers** — `isSupported` is `false`, `permission` returns `denied`, `send` / `sendIfPermitted` return `null`.
- **iOS/iPadOS Safari tabs** — `requiresHomeScreenInstall` is `true`; notifications only work after the user adds the site to the Home Screen and opens it from there.
- **Android and mobile Chrome** — `new Notification()` is not available; the plugin uses `ServiceWorkerRegistration.showNotification()` via the bundled `notify-sw.js`.
- **Denied permission** — `Notification` is never constructed; methods return `null` or `denied` without throwing.
- **Default permission** — `send` returns `null` until the user grants access via `requestPermission()`.
- **Granted permission** — use `sendAsync()` on mobile and `send()` on desktop.

The plugin does not render UI, manage toast stacks, or persist preferences. Use your own components for in-app messaging and permission UX.

## Browser compatibility

| Environment | Notes |
|-------------|-------|
| Chrome, Edge, Opera (desktop) | Supported in secure contexts via `new Notification()` |
| Firefox (desktop) | Supported in secure contexts |
| Safari (macOS 16.4+) | Supported in secure contexts |
| Chrome (Android) | Requires the bundled service worker and `sendAsync()` |
| Safari (iOS / iPadOS) | Home Screen web app only; regular Safari tabs cannot receive notifications |
| HTTP (non-localhost) | Blocked — requires HTTPS |
| Web Workers / Service Workers | This plugin targets `window` / Alpine templates in the main document |

Always check `isSupported`, `requiresHomeScreenInstall`, and `permission` before showing permission prompts or assuming notifications will appear.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpinejs-notify" />
```

Or import the plugin module:

```ts
import notify from "@ailuracode/alpinejs-notify";
```

Individual helpers are also exported for non-Alpine use:

```ts
import {
  createNotifyMagic,
  isNotifySupported,
  sendNotification,
} from "@ailuracode/alpinejs-notify";
```

## Design notes

- **Magic, not store** — notifications are one-off actions, not shared reactive state.
- **Fail silent** — returning `null` keeps Alpine expressions and event handlers simple.
- **No UI coupling** — framework-agnostic; pair with your own toast or banner components for in-page feedback.
