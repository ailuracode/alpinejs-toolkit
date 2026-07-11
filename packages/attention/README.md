# @ailuracode/alpine-attention

Screen Wake Lock and Idle Detection magics for Alpine.js.

**[Full documentation →](../../docs/plugins/attention.md)**

For tab visibility (`$visibility`), use [`@ailuracode/alpine-env`](../env/README.md).

## Install

```bash
pnpm add @ailuracode/alpine-attention alpinejs
```

## Quick example

```ts
import Alpine from "alpinejs";
import attention from "@ailuracode/alpine-attention";

Alpine.plugin(attention);
Alpine.start();
```

```html
<button @click="$wakelock.request()" x-bind:disabled="$wakelock.isActive">
  Keep screen awake
</button>

<button @click="$idle.start()" x-bind:disabled="$idle.isWatching">
  Detect idle
</button>
<p x-show="$idle.isWatching">
  User: <span x-text="$idle.userState"></span>
</p>
```

## API summary

| | |
|-|-|
| **Magics** | `$wakelock`, `$idle` |
| **Wake lock** | `isSupported`, `isActive`, `isRequesting`, `request()`, `release()` |
| **Idle** | `isSupported`, `isWatching`, `userState`, `screenState`, `requestPermission()`, `start()`, `stop()` |

## Permission adapter

For the unified registry in `@ailuracode/alpine-permissions`:

```ts
import { createIdlePermissionAdapter } from "@ailuracode/alpine-attention";

createIdlePermissionAdapter();
// registry key: "idle-detection"
```

`IdleController` uses the same adapter internally. See [`@ailuracode/alpine-permissions`](../permissions/README.md).

## License

MIT
