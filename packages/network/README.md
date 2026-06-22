# @ailuracode/alpine-network

Network connectivity magic for Alpine.js.

**[Full documentation →](../../docs/network.md)**

## Install

```bash
npm install @ailuracode/alpine-network alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import network from "@ailuracode/alpine-network";

Alpine.plugin(network);
Alpine.start();
```

```html
<div x-show="!$network.isOnline">You are offline</div>
<button :disabled="!$network.isOnline">Save</button>
```

## API summary

| | |
|-|-|
| **Magic** | `$network` |
| **Properties** | `isOnline` (boolean) |

## License

MIT
