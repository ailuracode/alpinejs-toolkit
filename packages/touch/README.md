# @ailuracode/alpinejs-touch

Touch and pointer capability detection for Alpine.js.

**[Full documentation →](../../docs/plugins/touch.md)**

## Install

```bash
npm install @ailuracode/alpinejs-touch alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import touch from "@ailuracode/alpinejs-touch";

Alpine.plugin(touch);
Alpine.start();
```

```html
<div x-show="$touch.isTouch">Swipeable carousel</div>
<p x-show="!$touch.canHover">Tap to expand</p>
```

## API summary

| | |
|-|-|
| **Magic** | `$touch` |
| **Properties** | `isTouch`, `isCoarse`, `isFine`, `canHover`, `maxTouchPoints` |

## License

MIT
