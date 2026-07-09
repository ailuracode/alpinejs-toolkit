---
title: "Overlay"
description: "Package: @ailuracode/alpine-overlay"
---

Package: `@ailuracode/alpine-overlay`

Centralizes **portal root**, **z-index slot allocation**, and the
**open-stack registry** for Alpine.js overlays. Used by `@ailuracode/alpine-dialog`,
`@ailuracode/alpine-menu`, `@ailuracode/alpine-tooltip`, and `@ailuracode/alpine-command`
to render correctly stacked by default — no consumer-invented z-index scale,
no Tailwind-coupled `z-[60]` in plugin source.

Headless. No CSS framework assumptions, no mandatory markup. Side effect:
creates (or reuses) a single `<div id="overlay-root">` at the bottom of
`document.body`.

## Overview

Before overlay, every plugin that needed a teleported surface told
consumers to ship their own:

- `<template x-teleport="body">` and a Tailwind `z-[60]` (or `z-50`) class,
- plus a hand-maintained z-index scale across dialogs / menus / tooltips / modals.

Two overlays open at once, no convention — they stack by DOM order,
which is whatever Alpine rendered them in. Open a tooltip from a
dialog button, and the tooltip races behind the dialog backdrop.

Overlay fixes this:

- **Portal root** lives at `#overlay-root`, owned by the plugin.
- **z-index slots** come from a single scale (`baseZIndex`, default
  `1000`, with a configurable `step`, default `10`).
- **`stack`** is a reactive array that lets you render an external
  inspector (debug tool, dev panel) for every open overlay.

The plugin is **opt-in**: feature plugins (`alpine-dialog`, etc.) do
NOT import `alpine-overlay`. Templates add the overlay reference
defensively. If overlay is loaded, the templates get programmatic
z-index from a single source of truth; if not, they keep their legacy
`<template x-teleport="body">` template.

## When NOT to use overlay

- **Inline panels** (tabs, accordion, disclosure) — these are not
  overlays and should not live in `#overlay-root`. Their stacking is
  handled by document flow.
- **Plugin-internal scroll-lock / focus-trap helpers** — these stay
  in the feature plugin source (`alpine-dialog/focus.ts`,
  `$store.scroll`). Overlay does not own semantics; it owns positions.
- **CSS framework `z-index` scales** that conflict with overlay's
  programmatic `style.zIndex` — if your project has hardcoded z-index
  scales above `1000`, raise `baseZIndex` on overlay or pick one
  source of truth.
- **A consumer page that never opens more than one overlay at a time**
  — the simplest stack-with-DOM-order is fine for those, and overlay
  is dead weight.

## Install

```bash
pnpm add @ailuracode/alpine-overlay
```

Peer dependency: `alpinejs` `^3.0.0`. Runtime dependency:
`@ailuracode/alpine-ui` (for the internal `safeDocument` primitive
and the `createPortalRoot` helper that consumers can import for
non-Alpine use cases — see
[Advanced](#advanced).

## Registration

```js
import Alpine from "alpinejs";
import { overlayPlugin } from "@ailuracode/alpine-overlay";

Alpine.plugin(
  overlayPlugin({
    // Optional. Defaults: baseZIndex=1000, step=10, root=lazy.
    baseZIndex: 1000,
    step: 10,
  })
);

Alpine.start();
```

**Insertion order matters.** `overlayPlugin()` MUST run before any
plugin whose templates use `x-teleport="#overlay-root"`. The plugin
calls `configure()` synchronously on registration, which eagerly
appends `<div id="overlay-root">` to `document.body`. If a consumer
template evaluates `x-teleport="#overlay-root"` before the portal
root exists, Alpine silently no-ops and logs `Unable to find element
with selector #overlay-root`.

In `@alpinejs/toolkit`'s demo, the registration order is:

1. overlay (`overlayPlugin()`)
2. dialog, menu, tooltip, command (any plugin with teleported markup)

## API Reference

The plugin installs `$store.overlay` (reactive store) and the
`$overlay` magic (shorthand facade). Both expose the same surface:

### State (readonly getters)

| Member | Type | Description |
|---|---|---|
| `stack` | `readonly OverlayStackEntry[]` | Open overlays ordered by z-index (top of stack last) |
| `count` | `number` | `stack.length` — convenience accessor |
| `root` | `HTMLElement \| null` | Portal container, or `null` in SSR |
| `baseZIndex` | `number` | First slot (default `1000`) |
| `step` | `number` | Slot gap (default `10`) |

### Configuration

#### `configure(opts: OverlayOptions): void`

Idempotent. Accepts `{ root?, baseZIndex?, step? }`. Called
internally by `overlayPlugin()` on registration with whatever you
passed to the factory — most apps do not call it again. If the stack
is non-empty and you try to change `baseZIndex` or `step`, you get an
`INVALID_OPTIONS` error; destroy the controller and recreate it to
reset scale.

```js
$store.overlay.configure({ baseZIndex: 2000, step: 20 });
```

`root` can be a string selector (`"#overlay-root"`) or an
`HTMLElement`. The plugin resolves it on first call; subsequent calls
in the same stack lifetime ignore `root` changes.

### Slot allocation

#### `register(plugin: string, id: string): number`

Allocates a slot for `(plugin, id)` and returns the assigned
z-index. Idempotent — repeat calls with the same pair return the
existing z-index without emitting `'change'`.

```js
$store.overlay.register("dialog", "settings"); // 1000
$store.overlay.register("menu", "user-menu"); // 1010
$store.overlay.register("tooltip", "help"); // 1020
$store.overlay.register("dialog", "settings"); // 1000 (same)
```

Plugin and id must be non-empty strings.

#### `unregister(plugin: string, id: string): void`

Removes the entry. Silent no-op when the pair is unknown. The slot
is **burned** (not returned to a pool) — see
[Stack ordering](#stack-ordering) below for why.

```js
$store.overlay.unregister("menu", "user-menu"); // emits 'change'
$store.overlay.unregister("menu", "ghost"); // silent
```

### Queries

#### `zIndexOf(plugin: string, id: string): number | null`

Returns the allocated z-index for `(plugin, id)`, or `null` when
the pair is unknown. Use this in templates:

```html
<template x-teleport="#overlay-root">
  <div :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'settings') }">
    <!-- dialog markup -->
  </div>
</template>
```

#### `isOpen(plugin: string, id: string): boolean`

`true` when the pair is on the stack, `false` otherwise.

#### `count: number` (getter)

Always equals `stack.length`. Useful for debugging without walking
the array.

#### `stack: readonly OverlayStackEntry[]` (readonly)

Open overlays sorted by z-index ascending (top of stack last).
Each entry: `{ plugin, id, zIndex, openedAt }`.

### Events

#### `on(event: 'change', listener: OverlayChangeListener): Unsubscribe`

Subscribes to stack transitions. `OverlayChangeDetail` shape:

```ts
{
  action: "register" | "unregister";
  stack: readonly OverlayStackEntry[]; // snapshot AFTER the transition
  added?: OverlayStackEntry;           // present on 'register'
  removed?: OverlayStackEntry;         // present on 'unregister'
}
```

```js
const unsubscribe = $store.overlay.on("change", (detail) => {
  if (detail.action === "register") {
    console.log("opened", detail.added);
  } else {
    console.log("closed", detail.removed);
  }
});

// Later
unsubscribe();
```

Idempotent register does NOT emit `'change'` — so a noisy
open-close-open cycle on the same id is quiet.

## Template migration guide

The pattern swap is identical across dialog / menu / tooltip. Below
is the dialog migration — the others vary only in plugin name and
element type.

### Before (no overlay)

```html
<template x-teleport="body">
  <div
    x-show="$store.dialog.isOpen('settings')"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
  >
    <div
      x-bind="$store.dialog.dialogProps('settings')"
      x-init="$store.dialog.bindContainer('settings', $el)"
    >
      <!-- panel -->
    </div>
  </div>
</template>
```

### After (with overlay)

```html
<template x-teleport="#overlay-root">
  <div
    x-show="$store.dialog.isOpen('settings')"
    :style="{ zIndex: $store.overlay.zIndexOf('dialog', 'settings') }"
    class="fixed inset-0 flex items-center justify-center p-4"
  >
    <div class="absolute inset-0 bg-black/50" aria-hidden="true"></div>
    <div
      class="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
      x-bind="$store.dialog.dialogProps('settings')"
      x-init="$store.dialog.bindContainer('settings', $el)"
    >
      <!-- panel -->
    </div>
  </div>
</template>
```

What changed:

| Aspect | Before | After |
|---|---|---|
| Teleport target | `"body"` | `"#overlay-root"` |
| Container z-index | Tailwind `z-50` | Removed (programmatic via overlay) |
| Inline `:style.zIndex` | none | `:style="{ zIndex: $store.overlay.zIndexOf(...) }"` |
| Backdrop | Inline `bg-black/50` on the container | Separate sibling `<div class="absolute inset-0 bg-black/50">` |
| Panel position | Inside the colored container | Separate sibling `relative z-10` (above backdrop by DOM order) |

**Why the backdrop is a sibling now.** When two elements share
`position: fixed; inset-0` and the same z-index (or none), they
stack by DOM order: the LATER sibling paints OVER the earlier one.
The container holds the z-index; the backdrop relies on DOM order
to stay BELOW the panel (which is the LATER sibling with `relative
z-10`). Putting the backdrop inside a container with `bg-black/50`
made the entire wrapper opaque and pushed the panel under the
backdrop by accident in several real designs. The split-sibling
pattern (container holds z-index, backdrop + panel are siblings,
panel uses `relative z-10`) preserves the content-over-backdrop UX
across all template styles.

### Removing utility z-classes

**Drop the old `z-50` / `z-[N]` from the migrated wrapper.**
Programmatic `style.zIndex` has higher specificity than any utility
class (CSS specificity rules — inline style beats class selectors
unconditionally). Leaving the utility class in place does not break
visuals (the inline style wins), but it wastes a style rule and
confuses future readers who think it does something.

### Singleton plugins (command)

`alpine-command` is a singleton — there is only ever one palette.
The pattern is the same, with a `?? 1000` fallback so the palette
still sits above page content when overlay is not loaded:

```html
<template x-teleport="#overlay-root">
  <div
    x-show="$store.command.isOpen"
    :style="{ zIndex: $store.overlay.zIndexOf('command') ?? 1000 }"
    class="fixed inset-0 flex items-start justify-center p-6 pt-[12vh]"
  >
    <!-- backdrop + panel siblings -->
  </div>
</template>
```

### Soft-peer fallback

If a template uses overlay but the consumer did not load
`alpine-overlay`, Alpine evaluates `$store.overlay` against `null`
and Alpine logs a warning to the console. The template does NOT
crash — the `:style` binding resolves to `style.zIndex = undefined`
which the browser ignores.

Two ways to handle the absence:

1. **Replace the template** back with the legacy
   `<template x-teleport="body">` + `z-[N]` form when shipping a
   page that intentionally does not load overlay.
2. **Add a guarded version** that falls back to a hardcoded z-index:

   ```html
   :style="{ zIndex: $store.overlay?.zIndexOf('dialog', 'settings') ?? 50 }"
   ```

   (`$store.overlay?.zIndexOf(...)` evaluates to `undefined` when
   overlay is absent; the `?? 50` keeps visuals stable.)

The cleanest path is to require overlay when you adopt these
templates. The fallback is escape hatch, not a default.

## Advanced

### Multiple overlays stacked concurrently

A tooltip opened on top of a dialog on top of a menu — all three
on the stack at once. The order is z-index, **not** DOM order.
Closing the menu (lowest z-index) leaves dialog (middle) and
tooltip (top) visible; opening a fresh menu gives it the next
available slot, which may be higher than the tooltip. Iterate the
stack if your UX needs DOM-order-invariant insertion:

```html
<ol>
  <template x-for="entry in $store.overlay.stack" :key="entry.id">
    <li>
      <code x-text="entry.plugin + ':' + entry.id"></code> at
      <code x-text="entry.zIndex"></code>
    </li>
  </template>
</ol>
```

Tip: the demo's [Overlay](/playground/overlay) section renders
three concurrent overlays side by side as a visual reference.

### Portal helper for non-Alpine use

`@ailuracode/alpine-ui` exports `createPortalRoot()` for code that
needs a portal element without the rest of overlay:

```ts
import { createPortalRoot } from "@ailuracode/alpine-ui";

const root = createPortalRoot({ id: "my-portal" });
// Same element on subsequent calls.
```

This is the same primitive overlay uses internally. No Alpine,
no event emitter, no z-index logic. SSR-safe: returns `null` when
`document` is unavailable.

### SSR safety

`$store.overlay` works under SSR / Node test runners. `configure()`
is a no-op when `document` is undefined; `register()` still
allocates slots and emits `'change'`. Templates that read
`$store.overlay` are SSR-safe to render — `:style="{ zIndex: … }"`
serializes to nothing when the inner expression is `null`, and
`#overlay-root` is created on the client at plugin activation
time, before any `x-teleport` directive evaluates.

## Errors

`OverlayError` extends the built-in `Error` (the toolkit's
`ToolkitError` class lives in `@ailuracode/alpine-core` and is not
yet part of the published surface). All errors carry a stable
`code` for programmatic branching — do not localize or rewrite the
code string; the `message` is for humans.

| `code` | When | Recovery |
|---|---|---|
| `OVERLAY_NOT_CONFIGURED` | `register()` invoked after `destroy()`. | Recreate the controller via `createOverlay()`. |
| `INVALID_PLUGIN_ID` | `register()` or `unregister()` with empty `plugin` or `id`. | Pass a non-empty namespaced id (e.g. `"dialog:my-dialog"`). |
| `INVALID_OPTIONS` | `configure()` re-invoked with a different `baseZIndex` / `step` while the stack is non-empty, or `normalizeOverlayOptions()` received a non-finite / negative number. | Destroy and recreate the controller, or correct the option values. |
| `ALREADY_REGISTERED` | Reserved for the future `bringToFront` API. v1 `register()` is idempotent — never thrown. | n/a |

Catch with `try { … } catch (err) { if (isOverlayErrorCode(err.code)) … }`
or `if (err instanceof OverlayError)`. `isOverlayErrorCode()` is
the canonical type guard exported from the package root.

## Architecture

Overlay sits between primitive UI helpers and feature plugins in
the dependency graph:

```
core  →  ui (createPortalRoot)  →  overlay  →  demo + consumers
                                              ↘
                                                dialog / menu / tooltip / command (no import)
```

- **Headless** — no markup, no CSS framework assumptions, no Tailwind
  classes baked in.
- **Soft peer** — `alpine-dialog`, `alpine-menu`, `alpine-tooltip`,
  `alpine-command` MUST NOT import `alpine-overlay` (an architecture
  invariant enforces this). Templates reference `$store.overlay`
  defensively; legacy fallback keeps consumers working without
  overlay loaded.
- **Singleton** — `createOverlay()` returns one shared controller
  keyed at `@ailuracode/alpine-overlay/default`. Mirrors the
  theme / sidebar / scroll / media singleton pattern.
- **Reactive bridge** — the controller emits `change`; the Alpine
  adapter writes the snapshot onto Alpine's reactive proxy so
  templates re-render automatically. Mirrors
  `@ailuracode/alpine-scroll`'s bridge (see `packages/scroll/src/plugin.ts`).

For the full headless-controller split and ADR list (placement,
idempotent register, programmatic z-index, reactive bridge, soft
peer), see the design notes in `packages/overlay/src/controller.ts`.

## License

MIT © [ailuracode](https://github.com/ailuracode)
