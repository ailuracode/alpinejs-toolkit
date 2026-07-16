---
title: "Overlay"
description: "Raiz de portal centralizada, alocação de z-index e registro de overlays abertos para Alpine.js."
---

Package: `@ailuracode/alpine-overlay`

Raiz de portal centralizada, alocação de slots z-index e registro de overlays abertos para aplicações Alpine.js.

Headless. Sem Tailwind nem frameworks CSS. Sem mutação do DOM fora da raiz do portal.

## Instalação

```bash
pnpm add @ailuracode/alpine-overlay @ailuracode/alpine-core alpinejs
```

## Início rápido

```ts
import Alpine from "alpinejs";
import { overlayPlugin } from "@ailuracode/alpine-overlay";

Alpine.plugin(overlayPlugin({ baseZIndex: 1000, step: 10 }));

Alpine.start();
```

Template:

```html
<template x-teleport="#overlay-root">
  <div class="dialog" :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'confirm') }">
    <!-- ... -->
  </div>
</template>
```

### Evitar colisões de nomes

Se a sua aplicação já usa `$store.overlay` — ou outro plugin do toolkit registra esse nome — renomeie a superfície de integração sem tocar no controller:

```ts
Alpine.plugin(overlayPlugin({ storeKey: "stack" })); // → $store.stack
```

A constante exposta `DEFAULT_OVERLAY_STORE_KEY` mantém a renomeação descobrível via TypeScript.

## API

### `$store.overlay`

| Membro | Tipo | Descrição |
|---|---|---|
| `stack` | `readonly OverlayStackEntry[]` | Overlays abertos ordenados por z-index (o superior por último) |
| `count` | `number` | `stack.length` |
| `root` | `HTMLElement \| null` | Contentor do portal (criado de forma preguiçosa) |
| `baseZIndex` | `number` | Slot inicial (padrão `1000`) |
| `step` | `number` | Espaçamento entre slots (padrão `10`) |
| `configure(opts)` | `void` | Configuração idempotente. `root`, `baseZIndex`, `step`. |
| `register(plugin, id)` | `number` | Aloca um slot, devolve zIndex |
| `unregister(plugin, id)` | `void` | Liberta o slot (silencioso se desconhecido) |
| `zIndexOf(plugin, id)` | `number` | Consulta o zIndex alocado (`0` após destroy) |
| `isOpen(plugin, id)` | `boolean` | Se `(plugin, id)` está no stack |
| `on('change', cb)` | `Unsubscribe` | Subscrição a transições do stack |

### Magia `$overlay`

Atalho para `$store.overlay`. Mesma forma.
