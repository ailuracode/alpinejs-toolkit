# @ailuracode/alpine-share

Web Share API magic for Alpine.js.

**[Full documentation →](../../docs/share.md)**

## Install

```bash
npm install @ailuracode/alpine-share alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import share from "@ailuracode/alpine-share";

Alpine.plugin(share);
Alpine.start();
```

```html
<button
  x-show="$share.isSupported()"
  @click="await $share({ title: 'Hello', url: window.location.href })"
>
  Share page
</button>
```

## API summary

| | |
|-|-|
| **Magic** | `$share(data)` |
| **Helpers** | `$share.isSupported()`, `$share.canShare(data?)` |

Callable like `$clipboard`.

## License

MIT
