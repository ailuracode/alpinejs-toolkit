---
title: "Sidebar"
description: "Visibilidade do painel lateral com $store.sidebar."
---

Package: `@ailuracode/alpine-sidebar`

Controla a **visibilidade** do painel lateral (show / hide / toggle) com overlay, navegação por teclado e breakpoints responsivos. Agnóstico a framework CSS — todas as mudanças visuais são aplicadas via callbacks. Componha com `@ailuracode/alpine-scroll` para bloqueio de scroll do body.

O plugin é **headless** por design e não conhece largura, modo nem aparência da sua sidebar. A representação visual (drawer, rail, mini, expandido, flutuante, etc.) fica a cargo do consumidor via estado local do Alpine.

## Instalação

```bash
pnpm install @ailuracode/alpine-sidebar alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import sidebar from "@ailuracode/alpine-sidebar";

Alpine.plugin(sidebar());
Alpine.start();
```

### Com callbacks

Aplique suas próprias classes CSS ou atributos quando a visibilidade da barra lateral mudar:

```js
Alpine.plugin(
  sidebar({
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

### Com bloqueio de scroll

Componha com `@ailuracode/alpine-scroll` via callbacks para bloquear o scroll do body quando a barra lateral estiver visível:

```js
import scroll from "@ailuracode/alpine-scroll";
import sidebar from "@ailuracode/alpine-sidebar";

Alpine.plugin(scroll());
Alpine.plugin(
  sidebar({
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
      Alpine.store("scroll").lock();
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
      Alpine.store("scroll").unlock();
    },
  }),
);
```

## Helpers exportados

```js
import { sidebarOptions } from "@ailuracode/alpine-sidebar";
```

## Store API

Store name: `$store.sidebar`

### Estado

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `visible` | `boolean` | Se a barra lateral está visível no momento |
| `matchesBreakpoint` | `boolean` | Se a media query do breakpoint corresponde no momento |

### Getters

| Getter | Descrição |
|--------|-------------|
| `isVisible` | Alias para `visible` |
| `hasOverlay` | `true` quando visível e `closeOnOverlayClick` está habilitado (padrão) |

### Métodos

| Método | Descrição |
|--------|-------------|
| `show()` | Mostra a barra lateral |
| `hide()` | Oculta a barra lateral |
| `toggle()` | Alterna entre visível e oculta |

### Opções

| Opção | Tipo | Padrão | Descrição |
|--------|------|---------|-------------|
| `closeOnEscape` | `boolean` | `true` | Oculta a barra lateral ao pressionar Escape |
| `closeOnOverlayClick` | `boolean` | `true` | Oculta a barra lateral ao clicar no overlay |
| `breakpoint` | `string` | — | Media query CSS — oculta automaticamente quando deixa de corresponder |
| `onShow` | `() => void` | — | Chamado quando a barra lateral se torna visível |
| `onHide` | `() => void` | — | Chamado quando a barra lateral é ocultada |
| `onOverlayClick` | `() => void` | — | Chamado quando o overlay é clicado |

## Exemplos HTML

### Barra lateral com overlay e transições

```html
<div x-data>
  <button @click="$store.sidebar.toggle()">Toggle sidebar</button>

  <!-- Overlay -->
  <div
    x-show="$store.sidebar.hasOverlay"
    x-transition.opacity
    class="fixed inset-0 bg-black/50 z-40"
    @click="$store.sidebar.hide()"
  ></div>

  <!-- Sidebar panel -->
  <aside
    x-show="$store.sidebar.visible"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="-translate-x-full"
    x-transition:enter-end="translate-x-0"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="translate-x-0"
    x-transition:leave-end="-translate-x-full"
    class="fixed inset-y-0 left-0 z-50 w-64 bg-base-100 shadow-lg"
  >
    <nav class="p-4">
      <a href="/" class="block py-2">Home</a>
      <a href="/about" class="block py-2">About</a>
    </nav>
    <button @click="$store.sidebar.hide()" class="absolute top-4 right-4">✕</button>
  </aside>
</div>
```

### Fechamento automático responsivo

```js
Alpine.plugin(
  sidebar({
    breakpoint: "(min-width: 1024px)",
    onShow() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onHide() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

Quando o viewport cruza o breakpoint, a barra lateral se oculta automaticamente.

### A largura visual é responsabilidade do consumidor

O plugin não rastreia largura nem modo. Defina seu próprio estado visual no Alpine — por exemplo, um painel de 16rem contra um rail de 4rem:

```html
<div x-data="{ expanded: true }">
  <button @click="expanded = !expanded">
    <span x-text="expanded ? 'Collapse' : 'Expand'"></span>
  </button>

  <aside
    x-show="$store.sidebar.visible"
    x-transition
    :class="expanded ? 'w-64' : 'w-16'"
  >
    <a href="/" x-show="expanded">Home</a>
    <a href="/about" x-show="expanded">About</a>
  </aside>
</div>
```

Você pode trocar isso por qualquer outra estratégia — um atributo `data-mode`, um `x-data` separado para o rail, uma implementação apenas com CSS, ou nada.

## Veja também

- [Rolagem](./scroll.md) — componha com `$store.scroll` para bloqueio de scroll do body via callbacks
- [Tema](./theme.md) — padrão similar de plugin factory com callbacks
