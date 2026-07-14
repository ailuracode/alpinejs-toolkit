---
title: "Menu"
description: "Store headless de menus com navegação por teclado, roving tabindex e helpers ARIA via $store.menu."
---

Package: `@ailuracode/alpine-menu`

Store headless de menus para dropdowns e context menus. Navegação por teclado (`Arrow*`, `Home`, `End`, `Enter`, `Space`, `Escape`), roving tabindex e helpers ARIA. **Apenas um menu aberto por vez por padrão** — abrir um menu fecha qualquer outro aberto. **Nenhum HTML ou CSS é incluído.**

## Instalação

```bash
pnpm add @ailuracode/alpine-menu alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import menu from "@ailuracode/alpine-menu";

Alpine.plugin(menu());
Alpine.start();
```

Componha bloqueio de scroll com [`@ailuracode/alpine-scroll`](./scroll.md) (ativo enquanto pelo menos um menu estiver aberto):

```js
menu({
  scroll: Alpine.store("scroll"),
});
```

Posicione com `@alpinejs/anchor` (recomendado para menus teleportados):

```js
Alpine.plugin(anchor);
// x-anchor.bottom-start.fixed no painel do menu
```

## Opções do plugin

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `exclusive` | `true` | Ao abrir um menu, fecha todos os outros abertos |
| `scroll` | — | Store opcional de `@ailuracode/alpine-scroll` bloqueada enquanto pelo menos um menu estiver aberto |

## Modo exclusivo

Por padrão (`exclusive: true`), `open(id)` e `toggle(id)` fecham todo outro menu aberto antes de abrir o alvo. Este é o comportamento esperado para **dropdown menus**, **context menus** e overlays similares onde apenas um painel deve estar visível.

```js
// Padrão — nenhuma config necessária
Alpine.plugin(menu());
```

Quando um segundo menu abre, o primeiro fecha automaticamente. O scroll lock permanece sincronizado: substituir um menu aberto por outro não desbloqueia a página brevemente.

### Múltiplos menus abertos

Passe `exclusive: false` para permitir que menus não relacionados permaneçam abertos ao mesmo tempo:

```js
Alpine.plugin(menu({ exclusive: false }));
```

### Exclusividade agrupada (menubar)

Com `exclusive: false`, atribua um `group` ao registrar menus para impor **um menu aberto por grupo** — útil para uma menubar horizontal sem afetar dropdowns globais:

```js
Alpine.plugin(menu({ exclusive: false }));

$store.menu.register("file", { group: "menubar-1" });
$store.menu.register("edit", { group: "menubar-1" });
$store.menu.register("help", { group: "menubar-2" });
$store.menu.register("account"); // sem group — nunca fechado automaticamente pela lógica de grupo
```

| Cenário | `file` aberto | `edit` aberto | `help` aberto | `account` aberto |
|----------|-------------|-------------|-------------|----------------|
| Abrir `edit` | fecha | abre | inalterado | inalterado |
| Abrir `account` | inalterado | inalterado | inalterado | abre |
| Abrir `help` depois `file` | abre | inalterado | inalterado | inalterado |

`group` só se aplica quando `exclusive` do plugin é `false`. Com `exclusive: true` (padrão), todo menu aberto é fechado independentemente do grupo.

## Store API

| Método | Descrição |
|--------|-------------|
| `register(id, options?)` | Cria uma instância de menu (`orientation`, `group`, callbacks) |
| `open(id)` / `close(id)` / `toggle(id)` | Visibilidade; `open` / `toggle` fecham outros menus quando `exclusive` está habilitado |
| `isOpen(id)` | Estado aberto |
| `activeItem(id)` | Id do item atualmente focado |
| `registerItem(menuId, itemId, options?)` | Registra um item de menu |
| `bindMenu(menuId, element)` | Anexa a raiz do menu para roving focus |
| `bindTrigger(menuId, element)` | Anexa o trigger para detecção de clique externo |
| `handleOutsideClick(menuId, event)` | Fecha ao clicar fora de trigger + menu |
| `handleWindowOutsideClick(event, menuIds?)` | Helper de clique externo para múltiplos menus na mesma página |
| `handleKeydown(menuId, event)` | Navegação por teclado |
| `handleWindowKeydown(event, menuIds?)` | Roteia eventos de teclado para o primeiro menu aberto |
| `itemProps(menuId, itemId)` | `role`, `tabindex`, `aria-disabled` |
| `menuProps(menuId)` | `role`, `aria-orientation` |

### Opções por menu

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `orientation` | `"vertical"` | Eixo das teclas de seta |
| `closeOnSelect` | `true` | Fechar após `selectItem()` |
| `group` | — | Quando `exclusive` do plugin é `false`, apenas um menu no mesmo `group` pode estar aberto |
| `onOpen` / `onClose` | — | Callbacks de lifecycle |
| `onSelect` | — | Disparado quando um item é escolhido (clique, Enter ou Space) |

## Arquitetura

`MenuController` possui todo o estado mutável de menu em um registry privado de instâncias. O plugin Alpine é um adaptador fino:

1. Comandos da store (`open`, `close`, `registerItem`, …) encaminham ao controller.
2. O controller emite eventos tipados `open`, `close`, `select` e `change`.
3. O plugin copia **snapshots somente leitura** para `$store.menu.instances` para que templates Alpine permaneçam reativos.

Mutar `$store.menu.instances[id]` diretamente **não** altera o estado do controller. Use métodos da store ou inscreva-se em eventos do controller para adaptadores personalizados.

## Uso standalone (sem Alpine)

```ts
import {
  createMenuController,
  createMenuStore,
  createMenuStoreFromController,
} from "@ailuracode/alpine-menu";

const controller = createMenuController({ exclusive: true });
controller.register("user-menu");
controller.open("user-menu");

const store = createMenuStore({ exclusive: true });
// ou: createMenuStoreFromController(controller)
```

| Controller API | Descrição |
|----------------|-------------|
| `hasInstance(id)` | Se um id de menu está registrado |
| `snapshotInstances()` | Cópias somente leitura rasas para sync do adaptador |
| `isOpen(id)` / `activeItem(id)` | Métodos de consulta |

## Migração

| Removido / alterado | Substituição |
|-------------------|-------------|
| `MenuController.instances` | `snapshotInstances()` ou `hasInstance(id)` |
| `constructor(instances, config)` | `constructor(config)` |
| Comandos com `instances` como primeiro argumento | Mesmo comando sem `instances` — ex.: `open(id)` |
| `controller.toStore()` | `createMenuStore()` ou `createMenuStoreFromController(controller)` |

## Markup básico

```html
<div
  x-data
  x-init="$store.menu.register('user-menu', { onSelect: (id) => console.log(id) }); ['profile','settings','logout'].forEach(id => $store.menu.registerItem('user-menu', id))"
  @keydown.window="$store.menu.handleWindowKeydown($event, ['user-menu'])"
  x-on:click.window="$store.menu.handleWindowOutsideClick($event, ['user-menu'])"
>
  <div x-ref="menuTrigger" x-init="$store.menu.bindTrigger('user-menu', $el)">
    <button @click="$store.menu.toggle('user-menu')" aria-haspopup="menu">Account</button>
  </div>

  <template x-teleport="body">
    <ul
      x-bind="$store.menu.menuProps('user-menu')"
      x-init="$store.menu.bindMenu('user-menu', $el)"
      x-show="$store.menu.isOpen('user-menu')"
      x-anchor.bottom-start.offset.8.fixed="$refs.menuTrigger"
      class="z-50 min-w-48"
    >
    <template x-for="id in ['profile','settings','logout']" :key="id">
      <li>
        <button
          x-bind="$store.menu.itemProps('user-menu', id)"
          @click="$store.menu.selectItem('user-menu', id)"
          x-text="id"
        ></button>
      </li>
    </template>
  </ul>
  </template>
</div>
```

## Acessibilidade

- Roving `tabindex` no item ativo
- Orientação vertical ou horizontal
- `Escape` fecha o menu
- `Enter` / `Space` seleciona o item ativo

## SSR

Registre itens durante `x-init` no cliente. Controle visibilidade com `x-show` (ou seu próprio CSS).

## Limitações

- Com `exclusive: true` (padrão), apenas um menu está aberto por vez — adequado para dropdowns e context menus
- Coloque `@click.outside` em um wrapper que inclua o trigger — não apenas no painel do menu, ou cliques de abertura dispensarão imediatamente
- Para menus teleportados, use `@click.window` + `handleOutsideClick()` para que cliques externos ignorem trigger e painel
- Conecte `@keydown.window` enquanto o menu estiver aberto; `@keydown` apenas no painel perde teclas quando o foco permanece no trigger
- Com múltiplos menus na mesma página, use `handleWindowOutsideClick($event, menuIds)` e `handleWindowKeydown($event, menuIds)` em `@keydown.window` / `x-on:click.window`
- Use `<template x-teleport="body">` com `bindTrigger()` + `bindMenu()` quando o menu estiver dentro de ancestrais `overflow-hidden`
- Chame `bindMenu()` na raiz do menu para que setas movam roving focus ao item ativo
- Posicione com `@alpinejs/anchor` — a store não define `top` / `left`
