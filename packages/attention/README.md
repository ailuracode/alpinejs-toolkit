# @ailuracode/alpine-attention

Screen Wake Lock, Idle Detection, and tab visibility magics for Alpine.js.

**[Full documentation →](../../docs/plugins/attention.md)**

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

<div x-show="!$visibility.isVisible">Tab is in the background</div>
```

## API summary

| | |
|-|-|
| **Magics** | `$wakelock`, `$idle`, `$visibility` |
| **Wake lock** | `isSupported`, `isActive`, `isRequesting`, `request()`, `release()` |
| **Idle** | `isSupported`, `isWatching`, `userState`, `screenState`, `requestPermission()`, `start()`, `stop()` |
| **Visibility** | `isVisible`, `isHidden`, `state`, `is(state)` — re-exported from `@ailuracode/alpine-core` |

## License

MIT
