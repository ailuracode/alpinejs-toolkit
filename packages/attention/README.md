# @ailuracode/alpine-attention

Screen Wake Lock and Idle Detection magics for Alpine.js.

**[Full documentation →](../../docs/plugins/attention.md)**

For tab visibility (`$visibility`), use [`@ailuracode/alpine-env`](../env/README.md).

## Install

```bash
npm install @ailuracode/alpine-attention alpinejs
```

## Quick example

```js
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

## License

MIT
