# @ailuracode/alpine-scroll

Scroll position tracking and reference-counted body scroll lock for Alpine.js.

**[Full documentation →](../../docs/plugins/scroll.md)**

## Install

```bash
npm install @ailuracode/alpine-scroll alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import scroll from "@ailuracode/alpine-scroll";

Alpine.plugin(scroll());
Alpine.start();
```

```html
<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">Top</button>
```

Scroll lock uses inline styles — no CSS classes required.

## Exported helpers

```js
import {
  SCROLL_DIRECTIONS,
  SCROLL_BEHAVIORS,
  computeScrollDirection,
  computeScrollMetrics,
  readScrollSnapshot,
  SCROLL_LOCK_AXES,
  scrollOptions,
} from "@ailuracode/alpine-scroll";
```

## API summary

| | |
|-|-|
| **Store** | `$store.scroll` |
| **State** | `x`, `y`, `direction` (`ScrollDirection`), `progress`, `atTop`, `atBottom`, `locked` |
| **Getters** | `isLocked`, `showToTop`, `isScrollingDown`, `isScrollingUp` |
| **Methods** | `isDirection()`, `lock({ axis? })`, `unlock()`, `toggleLock({ axis? })`, `toTop()`, `toBottom()` |
| **Lock axes** | `y` (default) — vertical only; `both` — vertical + horizontal |
| **Options** | `scrollOptions({ onLockChange })` |

## License

MIT
