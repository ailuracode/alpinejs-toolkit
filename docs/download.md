# Download

Package: `@ailuracode/alpine-download`

Trigger browser file downloads from Alpine templates via the `$download` magic. Supports URLs, blobs, files, and plain text. Never throws — resolves to `true` on success and `false` on failure.

## Install

```bash
npm install @ailuracode/alpine-download alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import download from "@ailuracode/alpine-download";

Alpine.plugin(download);
Alpine.start();
```

TypeScript consumers can add:

```ts
/// <reference types="@ailuracode/alpine-download/global" />
```

## Magic API

Callable like `$clipboard` and `$share`:

| Usage | Returns | Description |
|-------|---------|-------------|
| `await $download(source, options?)` | `Promise<boolean>` | Starts a download. Resolves `true` on success, `false` when unsupported or invalid. Never throws. |
| `$download.isSupported()` | `boolean` | `true` when anchor-based downloads are available. |

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
| `mimeType` | `string` | MIME type for plain-text downloads (default: `text/plain;charset=utf-8`) |

## HTML examples

### Download text

```html
<button @click="await $download('Hello world', 'hello.txt')">
  Download text
</button>
```

### Download a URL

```html
<button @click="await $download('/assets/guide.pdf', 'guide.pdf')">
  Download PDF
</button>
```

### Download generated JSON

```html
<div
  x-data="{
    exportData() {
      const payload = JSON.stringify({ savedAt: Date.now() }, null, 2);
      return $download(payload, {
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
      const ok = await $download(reportText, 'report.txt');
      this.status = ok ? 'saved' : 'failed';
      setTimeout(() => this.status = 'idle', 2000);
    }
  }"
>
  <button type="button" @click="saveReport()">Save report</button>
  <p x-show="status === 'saved'" x-cloak>Download started.</p>
  <p x-show="status === 'failed'" x-cloak>Download failed.</p>
</div>
```

## Browser support

- Works in all modern browsers with `<a download>` support
- Cross-origin URLs may open in a new tab instead of downloading when the server does not send permissive CORS headers — host files on the same origin or use blob downloads for generated content
- `File` and `Blob` downloads use object URLs and work offline

## Security

Downloads should be triggered by a user gesture (click). Call `$download()` from event handlers, not on page load.
