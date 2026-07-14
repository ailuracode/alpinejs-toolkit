---
title: "Tabs"
description: "Store headless de abas acessíveis com navegação por teclado e sync de URL."
---

Package: `@ailuracode/alpine-tabs`

Store headless de abas acessíveis com navegação por teclado, ativação manual/automática, helpers ARIA e sincronização opcional com query string da URL.

## Instalação

```bash
pnpm add @ailuracode/alpine-tabs alpinejs
```

O rastreamento da aba ativa usa estado leve inline — sem dependência extra.

## Configuração

```js
import Alpine from "alpinejs";
import tabs from "@ailuracode/alpine-tabs";

Alpine.plugin(tabs);
Alpine.start();
```

## Store API

| Método | Descrição |
|--------|-----------|
| `select(groupId, tabId)` | Ativa uma aba |
| `active(groupId)` | Id da aba ativa |
| `isActive(groupId, tabId)` | Se uma aba está ativa |
| `next(groupId)` / `previous(groupId)` | Percorre abas |
| `handleKeydown(groupId, event)` | Navegação Arrow/Home/End |
| `tabProps(groupId, tabId)` | `role`, `aria-selected`, `aria-controls` |
| `panelProps(groupId, tabId)` | `role`, `hidden`, `aria-labelledby` |
| `tablistProps(groupId)` | `role`, `aria-orientation` |

Registre um grupo com `urlParam: 'tab'` para sincronizar `?tab=` na barra de endereço (não é necessário plugin de URL separado).

## Markup básico

```html
<div
  x-data
  x-init="
    $store.tabs.register('settings-tabs', { defaultTab: 'profile' });
    ['profile','billing','security'].forEach(id => $store.tabs.registerTab('settings-tabs', id));
  "
>
  <div x-bind="$store.tabs.tablistProps('settings-tabs')" @keydown="$store.tabs.handleKeydown('settings-tabs', $event)">
    <template x-for="id in ['profile','billing','security']" :key="id">
      <button
        x-bind="$store.tabs.tabProps('settings-tabs', id)"
        @click="$store.tabs.select('settings-tabs', id)"
        x-text="id"
      ></button>
    </template>
  </div>

  <template x-for="id in ['profile','billing','security']" :key="id">
    <section x-bind="$store.tabs.panelProps('settings-tabs', id)">
      <p x-text="`Panel: ${id}`"></p>
    </section>
  </template>
</div>
```

## SSR

A sincronização de URL lê `window.location` apenas quando `register()` roda no cliente.

## Integração

- **Toast** — feedback opcional em demos ao trocar abas; não é exigido pelo plugin
