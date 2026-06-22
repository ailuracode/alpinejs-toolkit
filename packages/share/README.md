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
  @click="await $share.share({ title: 'Hello', url: window.location.href })"
>
  Share page
</button>
```

## API summary

| | |
|-|-|
| **Store** | `$store.share` |
| **Magic** | `$share` |
| **Methods** | `share(data)`, `isSupported()`, `canShare(data?)` |

Both `$store.share` and `$share` expose the same API object.

## License

MIT
