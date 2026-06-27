# @ailuracode/alpinejs-screen

Responsive device type and viewport width store for Alpine.js.

**[Full documentation →](../../docs/plugins/screen.md)**

## Install

```bash
npm install @ailuracode/alpinejs-screen alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(screen());
Alpine.start();
```

```html
<nav x-show="$store.device.is('mobile')">Mobile menu</nav>
<p>Width: <span x-text="$store.device.width"></span>px</p>
```

## Custom intervals

```js
Alpine.plugin(screen({
  intervals: [
    { name: "phone", maxWidth: 480 },
    { name: "tablet", maxWidth: 768 },
    { name: "desktop", maxWidth: Infinity },
  ],
}));
```

## API summary

| | |
|-|-|
| **Store** | `$store.device` |
| **State** | `type` (interval name), `width`, `intervals` (readonly) |
| **Methods** | `is(name)`, `refresh()`, `refreshWidth()` |
| **Helpers** | `DEFAULT_SCREEN_INTERVALS`, `screenIntervals()`, `readScreenSnapshot()`, `resolveScreenType()` |
| **Defaults** | mobile ≤767px · desktop ≥768px |

## License

MIT
