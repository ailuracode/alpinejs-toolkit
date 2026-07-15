# @ailuracode/alpine-command

Headless command palette (Spotlight-style) store — searchable actions, groups, keyboard navigation, nested pages, async execution, aliases, and ARIA helpers.

## Install

```bash
pnpm add @ailuracode/alpine-command alpinejs
```

Active item navigation uses inline helpers — no extra dependency.

## Setup

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

| Member | Description |
|--------|-------------|
| `open()` / `close()` / `toggle()` | Palette visibility |
| `isOpen` | Whether the palette is open |
| `search` | Reactive filter string |
| `activeIndex` | Keyboard-highlighted row |
| `filteredItems` / `visibleItems` | Visible commands for the current page |
| `groupedItems` | Filtered items grouped by `group` |
| `register(item)` | Register an action; returns `unregister()` |
| `run(id)` / `cancelRun()` | Execute or cancel in-flight async work |
| `pushPage(page)` / `goBack()` | Nested command pages |
| `executionState` / `runningId` | Async execution state |
| `inputProps()` / `listboxProps()` / `optionProps(id)` | Headless ARIA props |
| `handleKeydown(event)` | Typing, Backspace, Arrow/Home/End/Enter/Escape |

### Command item

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

### Search

- Default strategy: substring ranking on label, aliases, keywords, group, and shortcut
- `searchStrategy: "fuzzy"` enables lightweight fuzzy matching
- `rank(item, search)` replaces the deprecated `filter(item, search)` boolean API

Disabled commands remain visible unless `hidden` is true. Keyboard navigation and `run()` skip disabled or loading commands.

## Plugin options

| Option | Default | Description |
|--------|---------|-------------|
| `id` | auto-generated | Controller identifier |
| `rank` / `searchStrategy` | substring | Ranker for the filter pipeline |
| `persistence` | — | Recent/pinned hooks (maxRecent, getRecent, setRecent, getPinned, setPinned) |
| `storeKey` | `'command'` | `$store` key the Alpine plugin registers under |
| `magicKey` | `'command'` (or `storeKey` when renamed) | `$command` magic key the Alpine plugin registers under |

### Avoiding name collisions

If your application already owns a `$store.command` or another toolkit plugin registers on that name, rename the integration surface without touching the controller:

```ts
Alpine.plugin(commandPlugin({
  storeKey: "palette",         // → $store.palette
  // magicKey follows storeKey by default → $palette
  magicKey: "cmd",             // explicit override → $cmd
}));
```

`storeKey` is the only argument most hosts need. `magicKey` moves independently only when both names must be freed. The exposed constants `DEFAULT_COMMAND_STORE_KEY` and `DEFAULT_COMMAND_MAGIC_KEY` keep the rename discoverable from TypeScript.

## Integration

- **Overlay** — optional `overlayId` documents a palette layer id for `$store.overlay.zIndexOf(overlayId, layer)`
- **Scroll** — pass `scroll: $store.scroll` to lock page scroll while open (enabled by default when provided)
- **Keyboard** — global open shortcuts remain consumer-owned; compose with `@ailuracode/alpine-keyboard` when needed
- **Dialog / Toast** — render the palette in a dialog panel or call `$toast()` from `action` / `onRun`

Neither overlay, scroll, keyboard, dialog, nor toast is required.

## SSR

Register commands on the client. The controller does not touch browser globals during import or construction.

## Standalone usage

```ts
import { createCommandController } from "@ailuracode/alpine-command";

const command = createCommandController();
command.register({ id: "save", label: "Save", action: () => {} });
command.open();
```

## Migration notes

- `register()` now returns an unregister callback; `unregister(id)` remains available
- `filter` is deprecated in favor of `rank` or `searchStrategy`
- `filteredItems` now includes disabled commands; use `itemState(id)?.disabled` or `visibleItems` for runtime state
