---
title: "Tooltip"
description: "Store headless de tooltips com delays de abertura/fechamento e helpers ARIA."
---

Package: `@ailuracode/alpine-tooltip`

Store headless de tooltips. Gatilhos por hover/foco, delays de abertura e fechamento, dismiss com Escape. Combine com `@alpinejs/anchor` para posicionamento.

## Instalação

```bash
pnpm add @ailuracode/alpine-tooltip alpinejs
```

Posicionamento (Floating UI via Alpine):

```bash
pnpm add @alpinejs/anchor
```

## Configuração

```js
import Alpine from "alpinejs";
import tooltip from "@ailuracode/alpine-tooltip";

Alpine.plugin(tooltip);
Alpine.start();
```

## Store API

| Método | Descrição |
|--------|-----------|
| `open(id)` / `close(id)` / `toggle(id)` | Visibilidade |
| `isOpen(id)` | Estado aberto |
| `register(id, options?)` | Configura delays e callbacks de ciclo de vida |
| `showOnHover(id)` / `hideOnHover(id)` | Helpers de hover |
| `showOnFocus(id)` / `hideOnFocus(id)` | Helpers de foco |
| `handleKeydown(id, event)` | Dismiss com Escape |

### Opções por tooltip

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `openDelay` | `0` | ms antes de abrir no hover/foco |
| `closeDelay` | `0` | ms antes de fechar no mouseleave/blur |
| `onOpen` / `onClose` | — | Callbacks de ciclo de vida |

## Arquitetura

`TooltipController` possui todo o estado mutável dos tooltips. O plugin Alpine copia snapshots em `$store.tooltip.instances` a cada evento `change`. Mutar snapshots da store diretamente não altera o estado do controller.

## Uso standalone (sem Alpine)

```ts
import {
  createTooltipController,
  createTooltipStore,
  createTooltipStoreFromController,
} from "@ailuracode/alpine-tooltip";

const controller = createTooltipController();
controller.register("help", { openDelay: 150 });
controller.open("help");

const store = createTooltipStore();
// ou: createTooltipStoreFromController(controller)
```

| API do controller | Descrição |
|-------------------|-------------|
| `hasInstance(id)` | Se um id de tooltip está registrado |
| `snapshotInstances()` | Cópias readonly rasas para sincronização com adapter |
| `isOpen(id)` | Consulta estado aberto |

## Migração

| Removido / alterado | Substituição |
|---------------------|--------------|
| getter `controller.instances` | `snapshotInstances()` ou `hasInstance(id)` |
| `controller.toStore()` | `createTooltipStore()` ou `createTooltipStoreFromController(controller)` |

## Markup básico

```html
<div
  x-data
  x-init="$store.tooltip.register('help', { openDelay: 150 })"
  @keydown.window="$store.tooltip.isOpen('help') && $store.tooltip.handleKeydown('help', $event)"
>
  <button
    x-ref="helpAnchor"
    @mouseenter="$store.tooltip.showOnHover('help')"
    @mouseleave="$store.tooltip.hideOnHover('help')"
    @focus="$store.tooltip.showOnFocus('help')"
    @blur="$store.tooltip.hideOnFocus('help')"
    aria-describedby="help-tooltip"
  >
    Help
  </button>

  <template x-teleport="body">
    <div
      id="help-tooltip"
      x-show="$store.tooltip.isOpen('help')"
      x-anchor.top.fixed.offset.8="$refs.helpAnchor"
      role="tooltip"
      class="z-50"
    >
      Tooltip content
    </div>
  </template>
</div>
```

## SSR

Delays exigem timers no cliente — inicialize no cliente via `x-init`.

## Limitações

- O posicionamento é sua responsabilidade — use `@alpinejs/anchor` (`x-anchor.*.fixed`) para flip, shift e rastreamento de scroll
- Use `<template x-teleport="body">` + `x-anchor.fixed` quando o nó flutuante estiver dentro de ancestrais com `overflow-hidden`
- Conecte `@keydown.window` enquanto aberto para que Escape funcione quando o foco permanece no gatilho
