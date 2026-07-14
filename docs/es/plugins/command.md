---
title: "Command"
description: "Paleta de comandos headless al estilo Spotlight con búsqueda, grupos, páginas anidadas y ayudantes ARIA."
---

Package: `@ailuracode/alpine-command`

Store headless de paleta de comandos (estilo Spotlight) — acciones buscables, grupos, navegación por teclado, páginas anidadas, ejecución asíncrona, alias y ayudantes ARIA.

## Instalación

```bash
pnpm add @ailuracode/alpine-command alpinejs
```

La navegación del ítem activo usa ayudantes inline — sin dependencia extra.

## Configuración

```js
import Alpine from "alpinejs";
import { commandPlugin } from "@ailuracode/alpine-command";

Alpine.plugin(
  commandPlugin({
    searchStrategy: "substring",
    onRun(item) {
      console.log("Ran", item.id);
    },
    persistence: {
      maxRecent: 8,
      getRecent: () => JSON.parse(localStorage.getItem("recent-commands") ?? "[]"),
      setRecent: (ids) => localStorage.setItem("recent-commands", JSON.stringify(ids)),
    },
  })
);
Alpine.start();
```

## Store API

| Miembro | Descripción |
|---------|-------------|
| `open()` / `close()` / `toggle()` | Visibilidad de la paleta |
| `isOpen` | Si la paleta está abierta |
| `search` | Cadena de filtro reactiva |
| `activeIndex` | Fila resaltada por teclado |
| `filteredItems` / `visibleItems` | Comandos visibles para la página actual |
| `groupedItems` | Ítems filtrados agrupados por `group` |
| `register(item)` | Registra una acción; devuelve `unregister()` |
| `run(id)` / `cancelRun()` | Ejecuta o cancela trabajo asíncrono en curso |
| `pushPage(page)` / `goBack()` | Páginas de comandos anidadas |
| `executionState` / `runningId` | Estado de ejecución asíncrona |
| `inputProps()` / `listboxProps()` / `optionProps(id)` | Props ARIA headless |
| `handleKeydown(event)` | Escritura, Backspace, Arrow/Home/End/Enter/Escape |

### Ítem de comando

```ts
{
  id: "toggle-theme",
  label: "Toggle theme",
  group?: "Appearance",
  shortcut?: "⌘K",
  keywords?: ["dark", "light"],
  aliases?: ["spotlight"],
  disabled?: false | (() => boolean),
  hidden?: false | (() => boolean),
  enabled?: true | (() => boolean),
  pinned?: false,
  page?: "root",
  load?: async () => {},
  action: () => {},
}
```

### Búsqueda

- Estrategia predeterminada: ranking por subcadena en label, aliases, keywords, group y shortcut
- `searchStrategy: "fuzzy"` habilita coincidencia difusa ligera
- `rank(item, search)` reemplaza la API booleana obsoleta `filter(item, search)`

Los comandos deshabilitados permanecen visibles salvo que `hidden` sea `true`. La navegación por teclado y `run()` omiten comandos deshabilitados o en carga.

## Integración

- **Overlay** — `overlayId` opcional documenta un id de capa para `$store.overlay.zIndexOf(overlayId, layer)`
- **Scroll** — pasa `scroll: $store.scroll` para bloquear el scroll de la página mientras está abierta (habilitado por defecto cuando se proporciona). Ver [Scroll](./scroll.md).
- **Keyboard** — los atajos globales de apertura siguen siendo responsabilidad del consumidor; compón con `@ailuracode/alpine-keyboard` cuando haga falta
- **Dialog / Toast** — renderiza la paleta en un panel de diálogo o llama a `$toast()` desde `action` / `onRun`. Ver [Toast](./toast.md).

Ninguno de overlay, scroll, keyboard, dialog ni toast es obligatorio.

## SSR

Registra comandos en el cliente. El controller no toca globals del navegador durante import ni construcción.

## Uso standalone

```ts
import { createCommandController } from "@ailuracode/alpine-command";

const command = createCommandController();
command.register({ id: "save", label: "Save", action: () => {} });
command.open();
```

## Notas de migración

- `register()` ahora devuelve un callback de desregistro; `unregister(id)` sigue disponible
- `filter` está obsoleto en favor de `rank` o `searchStrategy`
- `filteredItems` ahora incluye comandos deshabilitados; usa `itemState(id)?.disabled` o `visibleItems` para el estado en tiempo de ejecución
