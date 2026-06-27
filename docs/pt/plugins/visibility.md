---
title: "Visibility"
description: "Visibilidade de separador e Page Visibility com $visibility."
---

Package: `@ailuracode/alpinejs-visibility`

Visibilidade reativa da aba via magic `$visibility`. Encapsula a [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) (`document.visibilityState`, `visibilitychange`).

## Instalação

```bash
npm install @ailuracode/alpinejs-visibility alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import visibility from "@ailuracode/alpinejs-visibility";

Alpine.plugin(visibility);
Alpine.start();
```

## Magic API

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `isVisible` | `boolean` (getter) | `true` quando a aba está visível |
| `isHidden` | `boolean` (getter) | `true` quando a aba está oculta |
| `state` | `VisibilityState` (getter) | `document.visibilityState` bruto |
| `is(state)` | `boolean` | `true` quando `state` corresponde à visibilidade atual |

## Helpers exportados

```js
import {
  VISIBILITY_STATES,
  createVisibilityState,
  readVisibilityState,
} from "@ailuracode/alpinejs-visibility";
```

## Exemplos HTML

```html
<div x-show="!$visibility.isVisible" class="background-banner">
  This tab is in the background
</div>

<span
  :class="$visibility.isVisible ? 'dot-active' : 'dot-idle'"
  x-text="$visibility.isVisible ? 'Active tab' : 'Background tab'"
></span>

<div x-show="$visibility.is('hidden')">
  Pause animations or polling while hidden
</div>
```

## Notas

- Dispara quando o usuário troca de aba, minimiza a janela ou bloqueia a tela
- Use `isVisible` para verificações booleanas; use `state` quando precisar do valor bruto de visibilidade
- Somente leitura — sem store, sem persistência
