# @ailuracode/alpine-download

Programmatic file downloads for Alpine.js.

**[Full documentation →](../../docs/download.md)**

## Install

```bash
npm install @ailuracode/alpine-download alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import download from "@ailuracode/alpine-download";

Alpine.plugin(download);
Alpine.start();
```

```html
<button @click="await $download('Hello world', 'hello.txt')">
  Download text
</button>

<button @click="await $download('/assets/report.pdf', 'report.pdf')">
  Download file
</button>
```

## API summary

| | |
|-|-|
| **Magic** | `$download(source, options?)` |
| **Helpers** | `$download.isSupported()` |

Callable like `$clipboard` and `$share`.

## License

MIT
