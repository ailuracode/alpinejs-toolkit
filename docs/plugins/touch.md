---
title: "Touch"
description: "Package: @ailuracode/alpinejs-touch"
---

Package: `@ailuracode/alpinejs-touch`

Detects touch devices and pointer capabilities via `$touch` magic. Updates on `matchMedia` changes.

## Install

```bash
npm install @ailuracode/alpinejs-touch alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import touch from "@ailuracode/alpinejs-touch";

Alpine.plugin(touch);
Alpine.start();
```

## Magic API

| Property | Type | Description |
|----------|------|-------------|
| `isTouch` | `boolean` | Touch device or coarse pointer |
| `isCoarse` | `boolean` | `(pointer: coarse)` matches |
| `isFine` | `boolean` | `(pointer: fine)` matches |
| `canHover` | `boolean` | `(hover: hover)` matches |
| `maxTouchPoints` | `number` | `navigator.maxTouchPoints` |

`isTouch` is `true` when any of these apply:

- Coarse pointer (`pointer: coarse`)
- `maxTouchPoints > 0`
- `'ontouchstart' in window`

## HTML examples

```html
<p x-show="$touch.isTouch">Touch-optimized controls</p>
<p x-show="$touch.canHover">Hover effects enabled</p>

<p>
  Pointer:
  <span x-text="$touch.isCoarse ? 'coarse (touch)' : 'fine (mouse)'"></span>
</p>
```

## Use cases

- Show larger tap targets on touch devices
- Disable hover-only UI when `!$touch.canHover`
- Branch layout logic alongside `@ailuracode/alpinejs-screen` for viewport size

## Notes

- Read-only magic — no store
- Combines several signals for reliable touch detection
- Reacts to device / pointer changes without page reload
