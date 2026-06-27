---
title: "Sidebar"
description: "Estado de painéis laterais com $store.sidebar."
---

Package: `@ailuracode/alpinejs-sidebar`

Controla o estado aberto/fechado da barra lateral com overlay, navegação por teclado e breakpoints responsivos. Agnóstico a framework CSS — todas as mudanças visuais são aplicadas via callbacks. Componha com `@ailuracode/alpinejs-scroll` para bloqueio de scroll do body.

Três estados: **open** (visível), **closed** (oculta) e **collapsed** (trilho compacto somente com ícones, opcional).

## Instalação

```bash
npm install @ailuracode/alpinejs-sidebar alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import sidebar from "@ailuracode/alpinejs-sidebar";

Alpine.plugin(sidebar());
Alpine.start();
```

### Com callbacks

Aplique suas próprias classes CSS ou atributos quando o estado da barra lateral mudar:

```js
Alpine.plugin(
  sidebar({
    onOpen() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onClose() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

### Com bloqueio de scroll

Componha com `@ailuracode/alpinejs-scroll` via callbacks para bloquear o scroll do body quando a barra lateral estiver aberta:

```js
import scroll from "@ailuracode/alpinejs-scroll";
import sidebar from "@ailuracode/alpinejs-sidebar";

Alpine.plugin(scroll());
Alpine.plugin(
  sidebar({
    onOpen() {
      document.documentElement.setAttribute("data-sidebar", "");
      Alpine.store("scroll").lock();
    },
    onClose() {
      document.documentElement.removeAttribute("data-sidebar");
      Alpine.store("scroll").unlock();
    },
  }),
);
```

## Helpers exportados

```js
import { sidebarOptions } from "@ailuracode/alpinejs-sidebar";
```

## Store API

Store name: `$store.sidebar`

### Estado

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `open` | `boolean` | Se a barra lateral está aberta no momento |
| `collapsed` | `boolean` | Se a barra lateral está em modo compacto (collapsed) |
| `matchesBreakpoint` | `boolean` | Se a media query do breakpoint corresponde no momento |

### Getters

| Getter | Descrição |
|--------|-------------|
| `isOpen` | Alias para `open` |
| `hasOverlay` | `true` quando aberta e `closeOnOverlayClick` está habilitado (padrão) |

### Métodos

| Método | Descrição |
|--------|-------------|
| `show()` | Abre a barra lateral |
| `hide()` | Fecha a barra lateral |
| `toggle()` | Alterna aberto/fechado |
| `collapse()` | Colapsa para modo compacto (somente ícones) |
| `expand()` | Expande a partir do modo compacto |
| `toggleCollapse()` | Alterna entre compacto e expandido |

### Opções

| Opção | Tipo | Padrão | Descrição |
|--------|------|---------|-------------|
| `closeOnEscape` | `boolean` | `true` | Fecha a barra lateral ao pressionar Escape |
| `closeOnOverlayClick` | `boolean` | `true` | Fecha a barra lateral ao clicar no overlay |
| `collapsed` | `boolean` | `false` | Inicia em modo compacto (collapsed) |
| `breakpoint` | `string` | — | Media query CSS — fecha automaticamente quando deixa de corresponder |
| `onOpen` | `() => void` | — | Chamado quando a barra lateral abre |
| `onClose` | `() => void` | — | Chamado quando a barra lateral fecha |
| `onOverlayClick` | `() => void` | — | Chamado quando o overlay é clicado |
| `onCollapse` | `() => void` | — | Chamado quando a barra lateral colapsa para modo compacto |
| `onExpand` | `() => void` | — | Chamado quando a barra lateral expande a partir do modo compacto |

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
    x-show="$store.sidebar.open"
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
    onOpen() {
      document.documentElement.setAttribute("data-sidebar", "");
    },
    onClose() {
      document.documentElement.removeAttribute("data-sidebar");
    },
  }),
);
```

Quando o viewport cruza o breakpoint, a barra lateral fecha automaticamente.

### Modo compacto (desktop)

Colapse a barra lateral para um trilho somente com ícones no desktop, painel completo no mobile:

```js
Alpine.plugin(
  sidebar({
    collapsed: false,
    onCollapse() {
      document.documentElement.setAttribute("data-sidebar-collapsed", "");
    },
    onExpand() {
      document.documentElement.removeAttribute("data-sidebar-collapsed");
    },
  }),
);
```

```html
<!-- Toggle compact mode -->
<button @click="$store.sidebar.toggleCollapse()">
  <span x-text="$store.sidebar.collapsed ? 'Expand' : 'Collapse'"></span>
</button>

<!-- Sidebar adapts via data attribute -->
<aside
  :class="$store.sidebar.collapsed ? 'w-16' : 'w-64'"
  x-transition
>
  <nav>
    <a href="/" x-show="!$store.sidebar.collapsed">Home</a>
    <a href="/about" x-show="!$store.sidebar.collapsed">About</a>
  </nav>
</aside>
```

## Veja também

- [Rolagem](./scroll.md) — componha com `$store.scroll` para bloqueio de scroll do body via callbacks
- [Tema](./theme.md) — padrão similar de plugin factory com callbacks
