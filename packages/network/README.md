# @ailuracode/alpinejs-network

Network connectivity magic for Alpine.js.

**[Full documentation →](../../docs/plugins/network.md)**

## Install

```bash
npm install @ailuracode/alpinejs-network alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import network from "@ailuracode/alpinejs-network";

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
| **Getters** | `isOnline`, `isOffline` (boolean) |
| **Helpers** | `readNetworkState()`, `createNetworkState()` |

## License

MIT
