# @ailuracode/alpinejs-share

Web Share API magic for Alpine.js.

**[Full documentation →](../../docs/plugins/share.md)**

## Install

```bash
npm install @ailuracode/alpinejs-share alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import share from "@ailuracode/alpinejs-share";

Alpine.plugin(share);
Alpine.start();
```

```html
<button
  x-show="$share.isSupported"
  @click="await $share({ title: 'Hello', url: window.location.href })"
>
  Share page
</button>
```

## API summary

| | |
|-|-|
| **Magic** | `$share(data)` |
| **Helpers** | `$share.isSupported` (getter), `$share.canShare(data?)` |

Callable like `$clipboard`.

## License

MIT
