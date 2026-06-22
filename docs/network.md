# Network

Package: `@ailuracode/alpine-network`

Reactive network connectivity via the `$network` magic. Wraps `navigator.onLine` and browser `online` / `offline` events.

## Install

```bash
npm install @ailuracode/alpine-network alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import network from "@ailuracode/alpine-network";

Alpine.plugin(network);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `isOnline` | `boolean` | `true` when the browser reports online |

## HTML examples

```html
<div x-show="!$network.isOnline" class="offline-banner">
  You are offline
</div>

<button :disabled="!$network.isOnline">
  Save (requires connection)
</button>

<span :class="$network.isOnline ? 'dot-online' : 'dot-offline'"></span>
```

## Notes

- Reflects the browser's connectivity hint, not a real network ping
- `isOnline` naming avoids redundant `$network.online`
- Read-only — no store, no persistence
