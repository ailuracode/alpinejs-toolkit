---
title: "Network"
description: "Package: @ailuracode/alpinejs-network"
---

Package: `@ailuracode/alpinejs-network`

Reactive network connectivity via the `$network` magic. Wraps `navigator.onLine` and browser `online` / `offline` events.

## Install

```bash
npm install @ailuracode/alpinejs-network alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import network from "@ailuracode/alpinejs-network";

Alpine.plugin(network);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `isOnline` | `boolean` (getter) | `true` when the browser reports online |
| `isOffline` | `boolean` (getter) | `true` when the browser reports offline |

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
