---
title: "Share"
description: "Web Share API con el magic $share."
---

Package: `@ailuracode/alpinejs-share`

Envoltorio ligero de la [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). Registra el magic invocable `$share`.

## Instalación

```bash
npm install @ailuracode/alpinejs-share alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import share from "@ailuracode/alpinejs-share";

Alpine.plugin(share);
Alpine.start();
```

Los consumidores de TypeScript pueden añadir:

```ts
/// <reference types="@ailuracode/alpinejs-share/global" />
```

## Magic API

Invocable como `$clipboard`:

| Uso | Devuelve | Descripción |
|-------|---------|-------------|
| `await $share(data)` | `Promise<boolean>` | Abre la hoja de compartir nativa. Se resuelve a `true` en caso de éxito, `false` al cancelar, denegar o con payloads no soportados. Nunca lanza excepciones. |
| `$share.isSupported` | `boolean` (getter) | `true` cuando `navigator.share` está disponible en un contexto seguro. |
| `$share.canShare(data?)` | `boolean` | Usa `navigator.canShare` cuando está presente; si no, comprueba campos compartibles. Sin `data`, devuelve si compartir está disponible en general. |

Usa `$share.isSupported` sin paréntesis en las plantillas.

`data` sigue la forma `ShareData` de la plataforma (`title`, `text`, `url`, `files`).

## Ejemplos HTML

### Compartir página actual

```html
<button
  x-show="$share.isSupported"
  @click="shared = await $share({
    title: document.title,
    url: window.location.href
  })"
>
  Share
</button>
```

### Proteger con `canShare`

```html
<button
  x-show="$share.canShare({ title: 'News', url: articleUrl })"
  @click="await $share({ title: 'News', url: articleUrl })"
>
  Share article
</button>
```

### Feedback del componente

```html
<div
  x-data="{
  status: 'idle',
  async sharePage() {
    const ok = await $share({
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

## Compatibilidad con navegadores

- Requiere un **contexto seguro** (HTTPS o `localhost`)
- Soportado en la mayoría de navegadores móviles y algunos de escritorio
- `navigator.canShare` es opcional; el plugin hace fallback a comprobaciones básicas de payload
- Compartir archivos depende de `navigator.canShare` y del soporte de la plataforma

## Seguridad

`navigator.share` debe iniciarse con un gesto del usuario (clic). Llama a `$share()` desde manejadores de eventos, no al cargar la página.
