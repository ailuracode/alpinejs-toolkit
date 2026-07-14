---
title: "Menu"
description: "Store headless de menús con navegación por teclado, roving tabindex y helpers ARIA."
---

Package: `@ailuracode/alpine-menu`

Store headless de menús para dropdowns y menús contextuales. Navegación por teclado (`Arrow*`, `Home`, `End`, `Enter`, `Space`, `Escape`), roving tabindex y helpers ARIA. **Solo un menú abierto a la vez por defecto** — abrir un menú cierra cualquier otro abierto. **No se incluye HTML ni CSS.**

## Instalación

```bash
pnpm add @ailuracode/alpine-menu alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import menu from "@ailuracode/alpine-menu";

Alpine.plugin(menu());
Alpine.start();
```

Compón el bloqueo de scroll con `@ailuracode/alpine-scroll` (activo mientras al menos un menú esté abierto):

```js
menu({
  scroll: Alpine.store("scroll"),
});
```

Posiciona con `@alpinejs/anchor` (recomendado para menús teleportados):

```js
Alpine.plugin(anchor);
// x-anchor.bottom-start.fixed en el panel del menú
```

## Opciones del plugin

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `exclusive` | `true` | Al abrir un menú, cierra todos los demás abiertos |
| `scroll` | — | Store opcional de `@ailuracode/alpine-scroll` bloqueado mientras al menos un menú esté abierto |

## Modo exclusivo

Por defecto (`exclusive: true`), `open(id)` y `toggle(id)` cierran todos los demás menús abiertos antes de abrir el objetivo. Este es el comportamiento esperado para **menús desplegables**, **menús contextuales** y overlays similares donde solo un panel debe ser visible.

```js
// Predeterminado — no hace falta configuración
Alpine.plugin(menu());
```

Cuando se abre un segundo menú, el primero se cierra automáticamente. El bloqueo de scroll permanece sincronizado: reemplazar un menú abierto por otro no desbloquea brevemente la página.

### Varios menús abiertos

Pasa `exclusive: false` para permitir que menús no relacionados permanezcan abiertos al mismo tiempo:

```js
Alpine.plugin(menu({ exclusive: false }));
```

### Exclusividad agrupada (menubar)

Con `exclusive: false`, asigna un `group` al registrar menús para imponer **un menú abierto por grupo** — útil para una barra de menú horizontal sin afectar dropdowns globales:

```js
Alpine.plugin(menu({ exclusive: false }));

$store.menu.register("file", { group: "menubar-1" });
$store.menu.register("edit", { group: "menubar-1" });
$store.menu.register("help", { group: "menubar-2" });
$store.menu.register("account"); // sin grupo — nunca se cierra automáticamente por lógica de grupo
```

| Escenario | `file` abierto | `edit` abierto | `help` abierto | `account` abierto |
|----------|----------------|----------------|----------------|-------------------|
| Abrir `edit` | cierra | abre | sin cambios | sin cambios |
| Abrir `account` | sin cambios | sin cambios | sin cambios | abre |
| Abrir `help` luego `file` | abre | sin cambios | sin cambios | sin cambios |

`group` solo aplica cuando el plugin tiene `exclusive: false`. Con `exclusive: true` (predeterminado), cada menú abierto se cierra sin importar el grupo.

## Store API

| Método | Descripción |
|--------|-------------|
| `register(id, options?)` | Crea una instancia de menú (`orientation`, `group`, callbacks) |
| `open(id)` / `close(id)` / `toggle(id)` | Visibilidad; `open` / `toggle` cierran otros menús cuando `exclusive` está habilitado |
| `isOpen(id)` | Estado abierto |
| `activeItem(id)` | Id del ítem actualmente enfocado |
| `registerItem(menuId, itemId, options?)` | Registra un ítem de menú |
| `bindMenu(menuId, element)` | Adjunta la raíz del menú para roving focus |
| `bindTrigger(menuId, element)` | Adjunta el disparador para detección de clic fuera |
| `handleOutsideClick(menuId, event)` | Cierra al hacer clic fuera del disparador + menú |
| `handleWindowOutsideClick(event, menuIds?)` | Helper de clic fuera para varios menús en una página |
| `handleKeydown(menuId, event)` | Navegación por teclado |
| `handleWindowKeydown(event, menuIds?)` | Enruta eventos de teclado al primer menú abierto |
| `itemProps(menuId, itemId)` | `role`, `tabindex`, `aria-disabled` |
| `menuProps(menuId)` | `role`, `aria-orientation` |

### Opciones por menú

| Opción | Predeterminado | Descripción |
|--------|----------------|-------------|
| `orientation` | `"vertical"` | Eje de las teclas de flecha |
| `closeOnSelect` | `true` | Cierra tras `selectItem()` |
| `group` | — | Cuando el plugin `exclusive` es `false`, solo un menú del mismo `group` puede estar abierto a la vez |
| `onOpen` / `onClose` | — | Callbacks de ciclo de vida |
| `onSelect` | — | Se dispara cuando se elige un ítem (clic, Enter o Space) |

## Arquitectura

`MenuController` posee todo el estado mutable de menús en un registro de instancias privado. El plugin de Alpine es un adaptador delgado:

1. Los comandos del store (`open`, `close`, `registerItem`, …) se reenvían al controller.
2. El controller emite eventos tipados `open`, `close`, `select` y `change`.
3. El plugin copia **snapshots de solo lectura** en `$store.menu.instances` para que las plantillas Alpine permanezcan reactivas.

Mutar `$store.menu.instances[id]` directamente **no** cambia el estado del controller. Usa métodos del store o suscríbete a eventos del controller para adaptadores personalizados.

## Uso standalone (sin Alpine)

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
// o: createMenuStoreFromController(controller)
```

| Controller API | Descripción |
|----------------|-------------|
| `hasInstance(id)` | Si un id de menú está registrado |
| `snapshotInstances()` | Copias shallow de solo lectura para sincronización del adaptador |
| `isOpen(id)` / `activeItem(id)` | Métodos de consulta |

## Migración

| Eliminado / cambiado | Reemplazo |
|----------------------|-----------|
| `MenuController.instances` | `snapshotInstances()` o `hasInstance(id)` |
| `constructor(instances, config)` | `constructor(config)` |
| Comandos con `instances` como primer argumento | Mismo comando sin `instances` — p. ej. `open(id)` |
| `controller.toStore()` | `createMenuStore()` o `createMenuStoreFromController(controller)` |

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

## Accesibilidad

- Roving `tabindex` en el ítem activo
- Orientación vertical u horizontal
- `Escape` cierra el menú
- `Enter` / `Space` selecciona el ítem activo

## SSR

Registra ítems durante `x-init` en el cliente. Controla la visibilidad con `x-show` (o tu propio CSS).

## Limitaciones

- Con `exclusive: true` (predeterminado), solo un menú está abierto a la vez — adecuado para dropdowns y menús contextuales
- Pon `@click.outside` en un wrapper que incluya el disparador — no solo en el panel del menú, o los clics de apertura lo cerrarán de inmediato
- Para menús teleportados, usa `@click.window` + `handleOutsideClick()` para que los clics fuera ignoren disparador y panel
- Conecta `@keydown.window` mientras el menú esté abierto; `@keydown` solo en el panel pierde teclas cuando el foco permanece en el disparador
- Con varios menús en una página, usa `handleWindowOutsideClick($event, menuIds)` y `handleWindowKeydown($event, menuIds)` en `@keydown.window` / `x-on:click.window`
- Usa `<template x-teleport="body">` con `bindTrigger()` + `bindMenu()` cuando el menú esté dentro de ancestros `overflow-hidden`
- Llama a `bindMenu()` en la raíz del menú para que las flechas muevan el roving focus al ítem activo
- Posiciona con `@alpinejs/anchor` — el store no establece `top` / `left`

## Ver también

- [Scroll](./scroll.md) — bloqueo de scroll mientras hay menús abiertos
- [Dialog](./dialog.md) — modales y focus trap
- [Primeros pasos](../getting-started.md)
