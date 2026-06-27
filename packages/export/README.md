# @ailuracode/alpinejs-export

Programmatic file exports (browser downloads) for Alpine.js.

**[Full documentation →](../../docs/plugins/export.md)**

## Install

```bash
npm install @ailuracode/alpinejs-export alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import exportPlugin from "@ailuracode/alpinejs-export";

Alpine.plugin(exportPlugin);
Alpine.start();
```

```html
<button @click="await $export('Hello world', 'hello.txt')">
  Export text
</button>

<button @click="await $export('/assets/report.pdf', 'report.pdf')">
  Export file
</button>
```

## API summary

| | |
|-|-|
| **Magic** | `$export(source, options?)` |
| **Helpers** | `$export.isSupported` (getter) |

Callable like `$clipboard` and `$share`.

## License

MIT
