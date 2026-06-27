---
title: "Clipboard"
description: "Package: @ailuracode/alpinejs-clipboard"
---

Package: `@ailuracode/alpinejs-clipboard`

Copy text to the system clipboard via the `$clipboard` magic. Uses the Clipboard API with a `execCommand` fallback.

## Install

```bash
npm install @ailuracode/alpinejs-clipboard alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import clipboard from "@ailuracode/alpinejs-clipboard";

Alpine.plugin(clipboard);
Alpine.start();
```

## Magic API

```js
await $clipboard(text)
await $clipboard(text, { mode: "clipboard" })
await $clipboard(text, "legacy")
```

| Argument | Type | Description |
|----------|------|-------------|
| `text` | `string \| number \| boolean \| bigint` | Coerced to string before copying |
| `options` | `"auto" \| "clipboard" \| "legacy" \| { mode? }` | Optional copy strategy. Default: `"auto"` |

| Mode | Behavior |
|------|----------|
| `auto` | Clipboard API when available, otherwise legacy `execCommand` |
| `clipboard` | Force `navigator.clipboard.writeText` |
| `legacy` | Force hidden `<textarea>` + `document.execCommand("copy")` |

Returns a `Promise` that resolves on success or rejects on failure.

## HTML examples

```html
<button @click="await $clipboard('Hello world')">Copy text</button>
<button @click="await $clipboard(window.location.href)">Copy URL</button>
```

### With local feedback state

Clipboard does not manage UI feedback. Keep status in the component:

```html
<div
  x-data="{
    status: 'idle',
    async copy(text) {
      try {
        await $clipboard(text);
        this.status = 'success';
      } catch {
        this.status = 'error';
      }
      setTimeout(() => this.status = 'idle', 2000);
    }
  }"
>
  <button @click="copy('Hello')">Copy</button>
  <p x-show="status === 'success'">Copied!</p>
  <p x-show="status === 'error'">Failed to copy</p>
</div>
```

## Browser support

- Modern browsers: `navigator.clipboard.writeText` (requires secure context — HTTPS or localhost)
- Fallback: hidden `<textarea>` + `document.execCommand('copy')`

## Security

Clipboard access may require a user gesture (click). Call `$clipboard` from event handlers, not on page load.
