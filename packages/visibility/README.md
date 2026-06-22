# @ailuracode/alpine-visibility

Tab visibility magic for Alpine.js.

**[Full documentation →](../../docs/visibility.md)**

## Install

```bash
npm install @ailuracode/alpine-visibility alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import visibility from "@ailuracode/alpine-visibility";

Alpine.plugin(visibility);
Alpine.start();
```

```html
<div x-show="!$visibility.isVisible">Tab is in the background</div>
<span x-text="$visibility.state"></span>
```

## API summary

| | |
|-|-|
| **Magic** | `$visibility` |
| **Properties** | `isVisible` (boolean), `state` (`"visible"` \| `"hidden"` \| `"prerender"`) |

## License

MIT
