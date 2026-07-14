---
title: "Virtual"
description: "Controller headless de lista virtual estilo TanStack Virtual para Alpine.js."
---

Package: `@ailuracode/alpine-virtual`

Controller headless de lista virtual para Alpine.js — cálculo de intervalo estilo TanStack Virtual sem renderizar markup.

## Instalação

```bash
pnpm add @ailuracode/alpine-virtual alpinejs @ailuracode/alpine-core
```

## Configuração

```ts
import Alpine from "alpinejs";
import virtual from "@ailuracode/alpine-virtual";

Alpine.plugin(virtual());
Alpine.start();
```

## Exemplo rápido

```html
<div
  x-data="{ items: Array.from({ length: 10000 }, (_, i) => ({ id: i, label: `Row ${i}` })) }"
  x-init="
    $store.virtual.create('list', { count: items.length, estimateSize: 36, overscan: 4 });
    $nextTick(() => {
      const el = $el.querySelector('[data-virtual-scroll]');
      if (el) $store.virtual.bindScrollElement('list', el);
    });
  "
>
  <div
    data-virtual-scroll
    class="h-64 overflow-auto"
    x-bind="$store.virtual.listProps('list', { label: 'Virtual list' })"
  >
    <div x-bind="$store.virtual.contentProps('list')">
      <template x-for="item in $store.virtual.instances.list?.virtualItems ?? []" :key="item.key">
        <div
          x-bind="$store.virtual.itemProps('list', item.index)"
          class="absolute left-0 top-0 w-full"
          :style="`transform: translateY(${item.start}px); height: ${item.size}px`"
          x-text="items[item.index].label"
        ></div>
      </template>
    </div>
  </div>
</div>
```

## Store API

- `$store.virtual.create(id, options)` — registra uma instância de lista virtual
- `$store.virtual.bindScrollElement(id, element)` — anexa o container de scroll (ou `window` quando `scrollMode: 'window'`)
- `$store.virtual.instances[id].virtualItems` — itens visíveis com `start`, `end`, `size`, `key`
- `$store.virtual.measureItem(id, index, size)` — reporta tamanho medido para linhas variáveis
- `$store.virtual.scrollToIndex(id, index, { align, behavior })` — scroll programático
- `$store.virtual.listProps` / `itemProps` / `contentProps` — ARIA headless + atributos de dados

## API do controller (sem Alpine)

```ts
import { createVirtualController } from "@ailuracode/alpine-virtual";

const controller = createVirtualController();
controller.create("logs", { count: 5000, estimateSize: 24 });
controller.on("rangeChange", ({ virtualItems }) => {
  render(virtualItems);
});
```

## Acessibilidade

Linhas fora da tela não estão no DOM. Não mova foco de teclado para itens não montados — use `scrollToIndex` para trazer a linha ativa ao intervalo visível antes de focar.
