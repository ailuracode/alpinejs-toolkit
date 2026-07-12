---
title: Keyboard
description: Headless scoped keyboard shortcut registry for Alpine.js
---

Headless keyboard command registry — shortcut registration, scoped activation, chord and sequence matching, conflict resolution, and editable-target filtering. Does **not** render shortcut help or a command palette.

## Install

```bash
pnpm add @ailuracode/alpine-keyboard @ailuracode/alpine-core alpinejs
```

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

Registers `$store.keyboard` and `$keyboard`.

## Scopes

Scopes gate which shortcuts are eligible. The default scope is `global`.

```ts
$keyboard.activateScope("editor");
$keyboard.register("mod+s", save, { scope: "editor", id: "save" });
$keyboard.suspendScope("editor"); // temporary pause
$keyboard.deactivateScope("editor");
```

Configure `pauseWhileScopesActive: ["modal"]` on the controller to pause **only-global** shortcuts while modal scopes are active.

## Sequences

Space-separated tokens define multi-key sequences:

```ts
keyboard.register("g h", () => goHome(), { id: "go-home" });
```

Sequences reset after `sequenceTimeout` (default `1000` ms) or when an unexpected key is pressed.

## Conflicts

Registrations with the same chord in the same scope emit a `conflict` event. At runtime the highest `priority` handler wins.

## Editable targets

By default shortcuts do not fire when focus is inside `input`, `textarea`, `select`, or `contenteditable` elements. Pass `allowInEditable: true` for editor-specific bindings.

## Standalone controller

```ts
import { createKeyboard } from "@ailuracode/alpine-keyboard";

const keyboard = createKeyboard();
const dispose = keyboard.register("mod+k", handler);
keyboard.mount(); // idempotent — attaches one window listener
keyboard.destroy(); // removes listeners and clears registrations
dispose();
```

## Accessibility

| Topic | Guidance |
|-------|----------|
| Discoverability | Render `$keyboard.commands` in your own help UI |
| Conflicts | Listen for `conflict` during development |
| Overlays | Use scoped shortcuts + `pauseWhileScopesActive` |
| Typing contexts | Keep default editable filtering; opt in per shortcut |

## Non-goals

- Replacing `x-on:keydown` for local element behavior
- Rendering shortcut help or command palette UI (see `@ailuracode/alpine-command`)
