# Share

Package: `@ailuracode/alpine-share`

Lightweight wrapper around the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). Registers both `$store.share` and magic `$share` with the same API.

## Install

```bash
npm install @ailuracode/alpine-share alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import share from "@ailuracode/alpine-share";

Alpine.plugin(share);
Alpine.start();
```

TypeScript consumers can add:

```ts
/// <reference types="@ailuracode/alpine-share/global" />
```

## API

Both `$store.share` and `$share` expose:

| Method | Returns | Description |
|--------|---------|-------------|
| `share(data)` | `Promise<boolean>` | Opens the native share sheet. Resolves `true` on success, `false` on cancel, denial, or unsupported payloads. Never throws. |
| `isSupported()` | `boolean` | `true` when `navigator.share` is available in a secure context. |
| `canShare(data?)` | `boolean` | Uses `navigator.canShare` when present; otherwise checks for shareable fields. Without `data`, returns whether sharing is generally available. |

`data` follows the platform `ShareData` shape (`title`, `text`, `url`, `files`).

## HTML examples

### Share current page

```html
<button
  x-show="$share.isSupported()"
  @click="shared = await $share.share({
    title: document.title,
    url: window.location.href
  })"
>
  Share
</button>
```

### Guard with `canShare`

```html
<button
  x-show="$store.share.canShare({ title: 'News', url: articleUrl })"
  @click="$store.share.share({ title: 'News', url: articleUrl })"
>
  Share article
</button>
```

### Component feedback

```html
<div
  x-data="{
  status: 'idle',
  async sharePage() {
    const ok = await $share.share({
      title: document.title,
      url: window.location.href
    });
    this.status = ok ? 'shared' : 'cancelled';
    setTimeout(() => this.status = 'idle', 2000);
  }
}"
>
  <button type="button" @click="sharePage()">Share</button>
  <p x-show="status === 'shared'" x-cloak>Thanks for sharing!</p>
  <p x-show="status === 'cancelled'" x-cloak>Share cancelled.</p>
</div>
```

## Browser support

- Requires a **secure context** (HTTPS or `localhost`)
- Supported on most mobile browsers and some desktop browsers
- `navigator.canShare` is optional; the plugin falls back to basic payload checks
- File sharing depends on `navigator.canShare` and platform support

## Security

`navigator.share` must be triggered by a user gesture (click). Call `share()` from event handlers, not on page load.
