---
title: "Export"
description: "Package: @ailuracode/alpinejs-export"
---

Package: `@ailuracode/alpinejs-export`

Trigger browser file downloads from Alpine templates via the `$export` magic. Supports URLs, blobs, files, and plain text. Never throws — resolves to `true` on success and `false` on failure.

> **Note:** This package is published as `alpine-export` (not `alpine-download`) because npm blocks new package names containing the word "download".

## Install

```bash
npm install @ailuracode/alpinejs-export alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import exportPlugin from "@ailuracode/alpinejs-export";

Alpine.plugin(exportPlugin);
Alpine.start();
```

TypeScript consumers can add:

```ts
/// <reference types="@ailuracode/alpinejs-export/global" />
```

## Magic API

Callable like `$clipboard` and `$share`:

| Usage | Returns | Description |
|-------|---------|-------------|
| `await $export(source, options?)` | `Promise<boolean>` | Starts a file download. Resolves `true` on success, `false` when unsupported or invalid. Never throws. |
| `$export.isSupported` | `boolean` (getter) | `true` when anchor-based exports are available. |

Use `$export.isSupported` without parentheses in templates.

### `source`

| Type | Behavior |
|------|----------|
| URL string (`https://…`, `/path`, `data:…`, `blob:…`) | Opens a temporary `<a download>` pointing at the URL |
| Plain text string | Requires a filename; saved as a text blob |
| `Blob` / `File` | Saved via `URL.createObjectURL` |

### `options`

Pass a filename string shorthand or an options object:

| Field | Type | Description |
|-------|------|-------------|
| `filename` | `string` | Suggested download name |
| `mimeType` | `string` | MIME type for plain-text exports (default: `text/plain;charset=utf-8`) |

## HTML examples

### Export text

```html
<button @click="await $export('Hello world', 'hello.txt')">
  Download text
</button>
```

### Export a URL

```html
<button @click="await $export('/assets/guide.pdf', 'guide.pdf')">
  Download PDF
</button>
```

### Export generated JSON

```html
<div
  x-data="{
    exportData() {
      const payload = JSON.stringify({ savedAt: Date.now() }, null, 2);
      return $export(payload, {
        filename: 'export.json',
        mimeType: 'application/json'
      });
    }
  }"
>
  <button type="button" @click="exportData()">Export JSON</button>
</div>
```

### Component feedback

```html
<div
  x-data="{
    status: 'idle',
    async saveReport() {
      const ok = await $export(reportText, 'report.txt');
      this.status = ok ? 'saved' : 'failed';
      setTimeout(() => this.status = 'idle', 2000);
    }
  }"
>
  <button type="button" @click="saveReport()">Save report</button>
  <p x-show="status === 'saved'" x-cloak>Download started.</p>
  <p x-show="status === 'failed'" x-cloak>Export failed.</p>
</div>
```

## Browser support

- Works in all modern browsers with `<a download>` support
- Cross-origin URLs may open in a new tab instead of downloading when the server does not send permissive CORS headers — host files on the same origin or use blob exports for generated content
- `File` and `Blob` exports use object URLs and work offline

## Security

Exports should be triggered by a user gesture (click). Call `$export()` from event handlers, not on page load.
