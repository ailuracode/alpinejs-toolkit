---
title: "Clipboard"
description: "Copiar al portapapeles con el magic $clipboard."
---

Package: `@ailuracode/alpinejs-clipboard`

Copia texto al portapapeles del sistema mediante el magic `$clipboard`. Usa la Clipboard API con un fallback de `execCommand`.

## Instalación

```bash
npm install @ailuracode/alpinejs-clipboard alpinejs
```

## Configuración

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

| Argumento | Tipo | Descripción |
|----------|------|-------------|
| `text` | `string \| number \| boolean \| bigint` | Se convierte a string antes de copiar |
| `options` | `"auto" \| "clipboard" \| "legacy" \| { mode? }` | Estrategia de copia opcional. Predeterminado: `"auto"` |

| Modo | Comportamiento |
|------|----------|
| `auto` | Clipboard API cuando está disponible, si no legacy `execCommand` |
| `clipboard` | Fuerza `navigator.clipboard.writeText` |
| `legacy` | Fuerza `<textarea>` oculto + `document.execCommand("copy")` |

Devuelve una `Promise` que se resuelve en caso de éxito o se rechaza en caso de fallo.

## Ejemplos HTML

```html
<button @click="await $clipboard('Hello world')">Copy text</button>
<button @click="await $clipboard(window.location.href)">Copy URL</button>
```

### Con estado de feedback local

Clipboard no gestiona feedback de UI. Mantén el estado en el componente:

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

## Compatibilidad con navegadores

- Navegadores modernos: `navigator.clipboard.writeText` (requiere contexto seguro — HTTPS o localhost)
- Fallback: `<textarea>` oculto + `document.execCommand('copy')`

## Seguridad

El acceso al portapapeles puede requerir un gesto del usuario (clic). Llama a `$clipboard` desde manejadores de eventos, no al cargar la página.
