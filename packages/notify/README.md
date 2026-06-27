# @ailuracode/alpinejs-notify

Web Notifications API wrapper for Alpine.js via the `$notify` magic.

**[Full documentation →](../../docs/plugins/notify.md)**

## Install

```bash
npm install @ailuracode/alpinejs-notify alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import notify from "@ailuracode/alpinejs-notify";

Alpine.plugin(notify);
Alpine.start();
```

Copy the service worker to your public folder:

```bash
cp node_modules/@ailuracode/alpinejs-notify/dist/notify-sw.js public/notify-sw.js
```

```html
<button @click="await $notify.sendAsync('Hello')">Notify</button>

<button
  x-show="$notify.isSupported && $notify.permission === 'default'"
  @click="await $notify.requestPermission()"
>
  Enable notifications
</button>
```

## API summary

| Member | Returns | Description |
|--------|---------|-------------|
| `isSupported` | `boolean` (getter) | Whether notifications can be shown |
| `requiresHomeScreenInstall` | `boolean` (getter) | iOS/iPadOS Safari tab limitation |
| `permission` | `NotificationPermission` (getter) | Current permission state |
| `requestPermission()` | `Promise<NotificationPermission>` | Prompt when `default` |
| `send(title, options?)` | `Notification \| null` | Desktop synchronous delivery |
| `sendAsync(title, options?)` | `Promise<Notification \| null>` | Mobile-safe delivery |
| `sendIfPermitted(title, options?)` | `Notification \| null` | Same as `send` |
| `sendIfPermittedAsync(title, options?)` | `Promise<Notification \| null>` | Same as `sendAsync` |
| `close(notification)` | `void` | Close without throwing |

## Browser compatibility

| Feature | Support |
|---------|---------|
| Chrome / Edge (desktop) | Full |
| Firefox (desktop) | Full |
| Safari (macOS 16.4+) | Full |
| Chrome (Android) | Service worker + `sendAsync()` |
| Safari (iOS) | Home Screen web app only |
| Secure context (HTTPS) | Required |
| Unsupported browsers | API returns `null` / `denied`; never throws |

See [docs/notify.md](../../docs/plugins/notify.md) for details and usage patterns.

## License

MIT
