# @ailuracode/alpine-transfer

Outbound data transfer magics: clipboard copy, Web Share, and programmatic file downloads.

## Install

```bash
pnpm add @ailuracode/alpine-transfer alpinejs
```

## Quick start

```js
import Alpine from "alpinejs";
import transfer from "@ailuracode/alpine-transfer";

Alpine.plugin(transfer());
Alpine.start();
```

## Magics

| Magic | Description |
|-------|-------------|
| `$clipboard` | Copy text to the clipboard |
| `$share` | Web Share API |
| `$export` | Programmatic file downloads |

## Selective registration

```js
Alpine.plugin(transfer({ share: false }));
```

### Avoiding name collisions

If your application already owns a `$clipboard`, `$share`, or `$export` magic — or another toolkit plugin registers on one of those names — rename the integration surface without forking the helpers:

```ts
Alpine.plugin(
  transfer({
    clipboardKey: "copy", // → $copy
    shareKey: "shareOut", // → $shareOut
    exportKey: "download", // → $download
  }),
);
```

The exposed constants `DEFAULT_TRANSFER_CLIPBOARD_KEY`, `DEFAULT_TRANSFER_SHARE_KEY`, and `DEFAULT_TRANSFER_EXPORT_KEY` keep the renames discoverable from TypeScript.

## `$clipboard`

Copy text with automatic fallback between the Clipboard API and `execCommand`.

```html
<button @click="$clipboard('Copied!')">Copy</button>
```

Modes: `"auto"` (default), `"clipboard"`, `"legacy"`.

```js
await $clipboard("hello", "clipboard");
await $clipboard("hello", { mode: "legacy" });
```

## `$share`

Share data via the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).

```html
<button
  x-show="$share.supported"
  @click="$share({ title: 'Hello', url: location.href })"
>
  Share
</button>
```

| Property / method | Description |
|-------------------|-------------|
| `supported` | `true` when `navigator.share` is available |
| `(data)` | Share `{ title?, text?, url?, files? }` |

## `$export`

Download blobs, strings, or JSON as files.

```html
<button @click="$export({ data: csv, filename: 'report.csv', mimeType: 'text/csv' })">
  Download
</button>
```

| Property / method | Description |
|-------------------|-------------|
| `supported` | `true` when programmatic download is available |
| `(options)` | `{ data, filename, mimeType? }` |

`data` accepts `string`, `Blob`, `ArrayBuffer`, `Uint8Array`, or serializable objects (exported as JSON).

## Standalone registration

```js
import {
  registerClipboardMagic,
  registerShareMagic,
  registerExportMagic,
} from "@ailuracode/alpine-transfer";

registerClipboardMagic(Alpine);
```

Aliases: `clipboardPlugin`, `sharePlugin`, `exportPlugin`.

## Utilities

| Function | Description |
|----------|-------------|
| `copyToClipboard(text, options?)` | Copy without Alpine |
| `shareData(data)` | Share without Alpine |
| `canShareData(data)` | Whether the payload can be shared |
| `isShareSupported()` | Web Share API availability |
| `exportData(options)` | Download without Alpine |
| `isExportSupported()` | Export availability |

## License

MIT
