# @ailuracode/alpine-share

Web Share API wrapper for Alpine.js.

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
| **Store** | `$store.share` |
| **Magic** | `$share(data)` |
| **Methods** | Store: `share(data)`, `isSupported()`, `canShare(data?)` — Magic: `await $share(data)`, `$share.isSupported()`, `$share.canShare(data?)` |

The magic is callable like `$clipboard`. Use `$store.share` when you prefer an object API.

## License

MIT
