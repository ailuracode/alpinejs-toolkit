# @ailuracode/alpine-notify

Web Notifications API wrapper for Alpine.js via the `$notify` magic.

**[Full documentation →](../../docs/notify.md)**

## Install

```bash
npm install @ailuracode/alpine-notify alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import notify from "@ailuracode/alpine-notify";

Alpine.plugin(notify);
Alpine.start();
```

```html
<button @click="$notify.send('Hello')">Notify</button>

<button
  x-show="$notify.isSupported() && $notify.permission() === 'default'"
  @click="await $notify.requestPermission()"
>
  Enable notifications
</button>

<button @click="$notify.sendIfPermitted('Background job finished')">
  Notify if allowed
</button>
```

## API summary

| Method | Returns | Description |
|--------|---------|-------------|
| `isSupported()` | `boolean` | Whether `Notification` exists |
| `permission()` | `NotificationPermission` | Current permission state |
| `requestPermission()` | `Promise<NotificationPermission>` | Prompt when `default` |
| `send(title, options?)` | `Notification \| null` | Show when `granted` |
| `sendIfPermitted(title, options?)` | `Notification \| null` | Same as `send` |
| `close(notification)` | `void` | Close without throwing |

## Browser compatibility

| Feature | Support |
|---------|---------|
| Chrome / Edge | Full |
| Firefox | Full |
| Safari (macOS 16.4+) | Full |
| Safari (iOS) | Not supported for page context |
| Secure context (HTTPS) | Required |
| Unsupported browsers | API returns `null` / `denied`; never throws |

See [docs/notify.md](../../docs/notify.md) for details and usage patterns.

## License

MIT
