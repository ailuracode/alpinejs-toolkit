---
title: "Keyboard"
description: "Registro de atajos de teclado con alcances, acordes, secuencias y el store $store.keyboard."
---

Package: `@ailuracode/alpine-keyboard`

Registro headless de atajos de teclado con alcances (scopes), acordes, secuencias, resolución de conflictos y normalización de `mod` según la plataforma.

## Instalación

```bash
pnpm add @ailuracode/alpine-keyboard @ailuracode/alpine-core alpinejs
```

## Ejemplo rápido

```ts
import Alpine from "alpinejs";
import { keyboardPlugin } from "@ailuracode/alpine-keyboard";

Alpine.plugin(
  keyboardPlugin({
    pauseWhileScopesActive: ["modal"],
    shortcuts: [
      {
        shortcut: "mod+k",
        handler: () => openCommandPalette(),
        options: {
          id: "command-palette",
          metadata: { label: "Open command palette", group: "Navigation" },
        },
      },
      {
        shortcut: "g h",
        handler: () => navigate("/"),
        options: { id: "go-home", metadata: { label: "Go home" } },
      },
    ],
  })
);

Alpine.start();
```

```html
<div
  x-data
  x-init="
    $keyboard.activateScope('editor');
    $keyboard.register('mod+s', () => save(), { scope: 'editor', id: 'save' });
  "
>
  <p x-text="$keyboard.commands.map((c) => c.label).join(', ')"></p>
</div>
```

## Store / magic API

`keyboardPlugin()` registra `$store.keyboard` y `$keyboard` (el mismo objeto reactivo).

| Miembro | Descripción |
|--------|-------------|
| `commands` | Metadatos de atajos de solo lectura para UIs de descubrimiento |
| `activeScopes` | Nombres de alcances actualmente activos |
| `suspendedScopes` | Alcances deshabilitados temporalmente |
| `register(shortcut, handler, options?)` | Registra un atajo; devuelve un disposer |
| `unregister(id)` | Elimina un atajo por id |
| `activateScope(scope)` | Habilita atajos vinculados a un alcance |
| `deactivateScope(scope)` | Deshabilita un alcance |
| `suspendScope(scope)` | Pausa un alcance sin desactivarlo |
| `resumeScope(scope)` | Reanuda un alcance suspendido |
| `handleKeydown(event)` | Despacha un evento de teclado manualmente |

## Controller API

```ts
import { createKeyboard } from "@ailuracode/alpine-keyboard";

const keyboard = createKeyboard({
  sequenceTimeout: 1000,
  pauseWhileScopesActive: ["modal"],
});

const dispose = keyboard.register("escape", (event) => {
  closeDialog();
}, { scope: "modal", priority: 10 });

keyboard.activateScope("modal");
dispose();
keyboard.destroy();
```

## Sintaxis de atajos

| Patrón | Significado |
|--------|-------------|
| `mod+k` | `meta+k` en macOS, `ctrl+k` en el resto |
| `ctrl+shift+p` | Acorde con modificadores explícitos |
| `g h` | Secuencia de dos teclas (timeout de 1 s por defecto) |
| `escape` | Teclas con nombre y alias (`esc`, `space`, flechas) |

## Accesibilidad

- Expone los metadatos de `commands` en un panel de ayuda construido por el host — este paquete no renderiza UI.
- Prefiere acordes sobre bindings globales de una sola tecla.
- Usa atajos con alcance dentro de overlays y configura `pauseWhileScopesActive`.
- Escucha eventos `conflict` mientras defines atajos.

## Plugin

```ts
import Alpine from "alpinejs";
import { keyboardPlugin } from "@ailuracode/alpine-keyboard";

Alpine.plugin(
  keyboardPlugin({
    pauseWhileScopesActive: ["modal"],
    shortcuts: [
      {
        shortcut: "mod+/",
        handler: () => showShortcutHelp(),
        options: {
          id: "shortcut-help",
          metadata: {
            label: "Show keyboard shortcuts",
            group: "Help",
          },
        },
      },
    ],
  })
);
```

Registra `$store.keyboard` y `$keyboard`.

## Alcances (scopes)

Los alcances determinan qué atajos son elegibles. El alcance predeterminado es `global`.

```ts
$keyboard.activateScope("editor");
$keyboard.register("mod+s", save, { scope: "editor", id: "save" });
$keyboard.suspendScope("editor"); // pausa temporal
$keyboard.deactivateScope("editor");
```

Configura `pauseWhileScopesActive: ["modal"]` en el controller para pausar atajos **solo globales** mientras haya alcances modales activos.

## Secuencias

Los tokens separados por espacio definen secuencias de varias teclas:

```ts
keyboard.register("g h", () => goHome(), { id: "go-home" });
```

Las secuencias se reinician tras `sequenceTimeout` (predeterminado `1000` ms) o cuando se pulsa una tecla inesperada.

## Conflictos

Los registros con el mismo acorde en el mismo alcance emiten un evento `conflict`. En tiempo de ejecución gana el handler con mayor `priority`.

## Destinos editables

Por defecto los atajos no se disparan cuando el foco está dentro de `input`, `textarea`, `select` o elementos `contenteditable`. Pasa `allowInEditable: true` para bindings específicos de editores.

## Controller standalone

```ts
import { createKeyboard } from "@ailuracode/alpine-keyboard";

const keyboard = createKeyboard();
const dispose = keyboard.register("mod+k", handler);
keyboard.mount(); // idempotente — adjunta un listener en window
keyboard.destroy(); // elimina listeners y limpia registros
dispose();
```

## Fuera de alcance

- No reemplaza `x-on:keydown` para comportamiento local en elementos.
- No renderiza ayuda de atajos ni UI de paleta de comandos (ver `@ailuracode/alpine-command`).

## Ver también

- [Command](./command.md) — paleta de comandos y descubrimiento de atajos
- [Dialog](./dialog.md) — alcances modales y `pauseWhileScopesActive`
- [Primeros pasos](../getting-started.md)
