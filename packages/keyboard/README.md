# @ailuracode/alpine-keyboard

Headless scoped keyboard shortcut registry with chords, sequences, conflict resolution, and platform-aware `mod` normalization.

## Install

```bash
pnpm add @ailuracode/alpine-keyboard @ailuracode/alpine-core alpinejs
```

## Quick example

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

`keyboardPlugin()` registers `$store.keyboard` and `$keyboard` (same reactive object).

| Member | Description |
|--------|-------------|
| `commands` | Readonly shortcut metadata for discovery UIs |
| `activeScopes` | Currently active scope names |
| `suspendedScopes` | Temporarily disabled scopes |
| `register(shortcut, handler, options?)` | Register a shortcut; returns disposer |
| `unregister(id)` | Remove a shortcut by id |
| `activateScope(scope)` | Enable shortcuts bound to a scope |
| `deactivateScope(scope)` | Disable a scope |
| `suspendScope(scope)` | Pause a scope without deactivating |
| `resumeScope(scope)` | Resume a suspended scope |
| `handleKeydown(event)` | Dispatch a keyboard event manually |

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

## Shortcut syntax

| Pattern | Meaning |
|---------|---------|
| `mod+k` | `meta+k` on macOS, `ctrl+k` elsewhere |
| `ctrl+shift+p` | Chord with explicit modifiers |
| `g h` | Two-key sequence (1 s timeout by default) |
| `escape` | Named keys and aliases (`esc`, `space`, arrows) |

## Accessibility

- Expose `commands` metadata in a host-built help panel — this package does not render UI.
- Prefer chords over single-key global bindings.
- Use scoped shortcuts inside overlays and configure `pauseWhileScopesActive`.
- Listen for `conflict` events while authoring shortcuts.

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

## Non-goals

- Replacing `x-on:keydown` for local element behavior
- Rendering shortcut help or command palette UI (see `@ailuracode/alpine-command`)

## License

MIT
