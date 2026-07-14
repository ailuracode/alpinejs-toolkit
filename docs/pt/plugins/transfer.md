---
title: "Transfer"
description: "Magics de transferência de dados: clipboard, Web Share e downloads programáticos."
---

Package: `@ailuracode/alpine-transfer`

Magics de transferência de dados de saída: cópia para clipboard, Web Share e downloads programáticos de arquivos.

## Magics

| Magic | Descrição |
|-------|-----------|
| `$clipboard` | Copiar texto para a área de transferência |
| `$share` | Web Share API |
| `$export` | Downloads programáticos de arquivos |

## Instalação

```bash
pnpm add @ailuracode/alpine-transfer alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import transfer from "@ailuracode/alpine-transfer";

Alpine.plugin(transfer());
Alpine.start();
```

## Registro seletivo

```js
Alpine.plugin(transfer({ share: false }));
```

## `$clipboard`

Copia texto com fallback automático entre a Clipboard API e `execCommand`.

```html
<button @click="$clipboard('Copied!')">Copy</button>
```

Modos: `"auto"` (padrão), `"clipboard"`, `"legacy"`.

```js
await $clipboard("hello", "clipboard");
await $clipboard("hello", { mode: "legacy" });
```

## `$share`

Compartilha dados via [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).

```html
<button
  x-show="$share.supported"
  @click="$share({ title: 'Hello', url: location.href })"
>
  Share
</button>
```

| Propriedade / método | Descrição |
|-------------------|-------------|
| `supported` | `true` quando `navigator.share` está disponível |
| `(data)` | Compartilha `{ title?, text?, url?, files? }` |

## `$export`

Faz download de blobs, strings ou JSON como arquivos.

```html
<button @click="$export({ data: csv, filename: 'report.csv', mimeType: 'text/csv' })">
  Download
</button>
```

| Propriedade / método | Descrição |
|-------------------|-------------|
| `supported` | `true` quando download programático está disponível |
| `(options)` | `{ data, filename, mimeType? }` |

`data` aceita `string`, `Blob`, `ArrayBuffer`, `Uint8Array` ou objetos serializáveis (exportados como JSON).

## Registro standalone

```js
import {
  registerClipboardMagic,
  registerShareMagic,
  registerExportMagic,
} from "@ailuracode/alpine-transfer";

registerClipboardMagic(Alpine);
```

Aliases: `clipboardPlugin`, `sharePlugin`, `exportPlugin`.

## Utilitários

| Função | Descrição |
|----------|-------------|
| `copyToClipboard(text, options?)` | Copiar sem Alpine |
| `shareData(data)` | Compartilhar sem Alpine |
| `canShareData(data)` | Se o payload pode ser compartilhado |
| `isShareSupported()` | Disponibilidade da Web Share API |
| `exportData(options)` | Download sem Alpine |
| `isExportSupported()` | Disponibilidade de export |
