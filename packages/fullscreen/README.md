# @ailuracode/alpine-fullscreen

Fullscreen API magic for Alpine.js.

**[Full documentation →](../../docs/fullscreen.md)**

## Install

```bash
npm install @ailuracode/alpine-fullscreen alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import fullscreen from "@ailuracode/alpine-fullscreen";

Alpine.plugin(fullscreen);
Alpine.start();
```

```html
<div x-data>
  <button @click="$fullscreen.toggle($el)">
    Toggle Fullscreen
  </button>
</div>
```

## API summary

| | |
|-|-|
| **Magic** | `$fullscreen` |
| **Methods** | `isSupported()`, `isFullscreen()`, `element()`, `enter()`, `exit()`, `toggle()`, `onChange()`, `onError()` |

All operations return `false` (or resolve to `false`) when fullscreen cannot be used. Nothing throws.

## License

MIT
