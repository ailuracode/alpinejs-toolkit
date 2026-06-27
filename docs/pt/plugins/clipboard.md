---
title: "Clipboard"
description: "Copiar para a área de transferência com o magic $clipboard."
---

Package: `@ailuracode/alpinejs-clipboard`

Copia texto para a área de transferência do sistema via magic `$clipboard`. Usa a Clipboard API com fallback para `execCommand`.

## Instalação

```bash
npm install @ailuracode/alpinejs-clipboard alpinejs
```

## Configuração

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

| Argumento | Tipo | Descrição |
|----------|------|-------------|
| `text` | `string \| number \| boolean \| bigint` | Convertido para string antes de copiar |
| `options` | `"auto" \| "clipboard" \| "legacy" \| { mode? }` | Estratégia de cópia opcional. Padrão: `"auto"` |

| Modo | Comportamento |
|------|----------|
| `auto` | Clipboard API quando disponível, caso contrário `execCommand` legado |
| `clipboard` | Força `navigator.clipboard.writeText` |
| `legacy` | Força `<textarea>` oculto + `document.execCommand("copy")` |

Retorna uma `Promise` que resolve em caso de sucesso ou rejeita em caso de falha.

## Exemplos HTML

```html
<button @click="await $clipboard('Hello world')">Copy text</button>
<button @click="await $clipboard(window.location.href)">Copy URL</button>
```

### Com estado de feedback local

A área de transferência não gerencia feedback de UI. Mantenha o status no componente:

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

## Suporte ao navegador

- Navegadores modernos: `navigator.clipboard.writeText` (exige contexto seguro — HTTPS ou localhost)
- Fallback: `<textarea>` oculto + `document.execCommand('copy')`

## Segurança

O acesso à área de transferência pode exigir um gesto do usuário (clique). Chame `$clipboard` a partir de handlers de eventos, não no carregamento da página.
