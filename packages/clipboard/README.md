# @ailuracode/alpinejs-clipboard

Copy text to the clipboard via Alpine.js magic.

**[Full documentation →](../../docs/plugins/clipboard.md)**

## Install

```bash
npm install @ailuracode/alpinejs-clipboard alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import clipboard from "@ailuracode/alpinejs-clipboard";

Alpine.plugin(clipboard);
Alpine.start();
```

```html
<button @click="await $clipboard('Hello world')">Copy</button>
```

## API summary

| | |
|-|-|
| **Magic** | `$clipboard(text, options?)` → `Promise<void>` |
| **Text** | `string \| number \| boolean \| bigint` (coerced to string) |
| **Modes** | `auto` (default), `clipboard`, `legacy` |
| **Note** | UI feedback is handled in your component, not the plugin |

## License

MIT
