---
title: "Accordion"
description: "Store headless de acordeão com modos single/multiple, default open e ARIA."
---

Package: `@ailuracode/alpine-accordion`

Store headless de acordeão com painéis abertos em modo **single** ou **multiple**, itens **default open** opcionais, gerenciamento de foco por teclado e helpers ARIA.

## Instalação

```bash
pnpm add @ailuracode/alpine-accordion alpinejs
```

O estado dos painéis abertos usa estado leve inline — sem dependência extra.

## Configuração

```js
import Alpine from "alpinejs";
import accordion from "@ailuracode/alpine-accordion";

Alpine.plugin(accordion);
Alpine.start();
```

## Store API

| Método | Descrição |
|--------|-----------|
| `register(accordionId, options?)` | Cria um grupo (`mode`, `defaultOpen`, `onChange`) |
| `registerItem(accordionId, itemId, disabled?)` | Registra um gatilho de painel |
| `open(accordionId, itemId)` / `close` / `toggle` | Visibilidade do painel |
| `isOpen(accordionId, itemId)` | Se um painel está expandido |
| `openIds(accordionId)` | Array de ids de itens abertos |
| `activeItem(accordionId)` | Id do gatilho com foco |
| `handleKeydown(accordionId, event)` | `ArrowUp`/`ArrowDown`/`Home`/`End` |
| `triggerProps(accordionId, itemId)` | `aria-expanded`, `aria-controls`, `tabindex` |
| `panelProps(accordionId, itemId)` | `role`, `aria-labelledby`, `aria-hidden` |

## Opções

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `mode` | `'single'` | `'single'` fecha outros painéis ao abrir um; `'multiple'` permite vários abertos |
| `defaultOpen` | — | Id ou array de ids abertos após `registerItem` |
| `onChange` | — | `(openIds: string[]) => void` quando o estado aberto muda |

No modo **single**, apenas o **primeiro** id em `defaultOpen` é usado quando um array é passado.

## Modo single

Apenas um painel aberto por vez.

```js
$store.accordion.register("faq", { mode: "single" });
["item-1", "item-2"].forEach((id) => $store.accordion.registerItem("faq", id));
```

```html
<div
  x-data
  x-init="
    $store.accordion.register('faq', { mode: 'single' });
    ['item-1','item-2'].forEach(id => $store.accordion.registerItem('faq', id));
  "
  @keydown="$store.accordion.handleKeydown('faq', $event)"
>
  <template x-for="id in ['item-1','item-2']" :key="id">
    <div>
      <button
        x-bind="$store.accordion.triggerProps('faq', id)"
        @click="$store.accordion.toggle('faq', id)"
        x-text="id"
      ></button>
      <div
        class="overflow-hidden"
        x-show="$store.accordion.isOpen('faq', id)"
        x-collapse
        x-bind="$store.accordion.panelProps('faq', id)"
      >
        <p class="px-4 py-3">Answer for <span x-text="id"></span></p>
      </div>
    </div>
  </template>
</div>
```

## Modo multiple

Vários painéis podem permanecer abertos.

```js
$store.accordion.register("settings", { mode: "multiple" });
["notifications", "privacy"].forEach((id) => $store.accordion.registerItem("settings", id));
```

```html
<div
  x-init="
    $store.accordion.register('settings', { mode: 'multiple' });
    ['notifications','privacy'].forEach(id => $store.accordion.registerItem('settings', id));
  "
>
  <!-- mesmo markup do modo single -->
</div>
```

## Default open

Passe `defaultOpen` no registro. Os painéis abrem automaticamente quando o item é registrado.

```js
// Single — um painel aberto na inicialização
$store.accordion.register("faq", {
  mode: "single",
  defaultOpen: "item-2",
});

// Multiple — vários painéis abertos na inicialização
$store.accordion.register("settings", {
  mode: "multiple",
  defaultOpen: ["notifications", "integrations"],
});

["item-1", "item-2", "item-3"].forEach((id) => $store.accordion.registerItem("faq", id));
```

Leia ids abertos de forma reativa:

```html
<span x-text="$store.accordion.openIds('faq').join(', ')"></span>
```

## Animação de painéis

`@ailuracode/alpine-accordion` é headless — não anima painéis. Use o plugin oficial [`@alpinejs/collapse`](https://alpinejs.dev/plugins/collapse): `x-collapse` deve ficar no **mesmo elemento** que `x-show`.

```bash
pnpm add @alpinejs/collapse
```

```js
import collapse from "@alpinejs/collapse";

Alpine.plugin(collapse);
```

```html
<div
  x-show="$store.accordion.isOpen('faq', id)"
  x-collapse
  x-bind="$store.accordion.panelProps('faq', id)"
  class="overflow-hidden"
>
  <div class="px-4 py-3">Panel content</div>
</div>
```

Coloque padding em um **wrapper interno** — padding vertical no mesmo nó que `x-collapse` impede a altura de chegar a `0` e a animação de fechamento pode parecer travada.

Modificadores opcionais: `x-collapse.duration.300ms`, `x-collapse.min.50px`. Veja a [documentação do plugin Collapse](https://alpinejs.dev/plugins/collapse).

`panelProps()` não define `hidden` — a visibilidade é controlada por `x-show` no cliente.

## SSR

Seguro quando os painéis começam recolhidos; visibilidade controlada com `x-show` no cliente. Use `defaultOpen` apenas quando o markup for hidratado no cliente.
