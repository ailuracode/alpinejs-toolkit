# @ailuracode/alpinejs-scroll

Scroll position tracking and reference-counted body scroll lock for Alpine.js.

**[Full documentation →](../../docs/plugins/scroll.md)**

## Install

```bash
npm install @ailuracode/alpinejs-scroll alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import scroll from "@ailuracode/alpinejs-scroll";

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
  scrollOptions,
} from "@ailuracode/alpinejs-scroll";
```

## API summary

| | |
|-|-|
| **Store** | `$store.scroll` |
| **State** | `x`, `y`, `direction` (`ScrollDirection`), `progress`, `atTop`, `atBottom`, `locked` |
| **Getters** | `isLocked`, `showToTop`, `isScrollingDown`, `isScrollingUp` |
| **Methods** | `isDirection()`, `lock()`, `unlock()`, `toggleLock()`, `toTop()`, `toBottom()` |
| **Options** | `scrollOptions({ onLockChange })` |

## License

MIT
