# Toast

Package: `@ailuracode/alpine-toast`

Headless in-app toast queue for Alpine.js. Registers the `$toast` magic and an internal reactive store for UI integrators.

## CSS-framework agnostic

This plugin ships **no HTML, no CSS, and no design tokens**. Variant and position names are **not hardcoded** — you declare the sets your UI needs. The only built-in concepts are:

- **`default`** — `$toast('Message')` or `{ variant: 'default' }`
- **`bottom-right`** — default `position` when omitted
- **`promise`** — `$toast.promise(factoryOrPromise, messages?)`

Map `toast.variant` and `toast.position` to layout/CSS in your own renderer (e.g. `data-position`, Tailwind classes, coordinates).

## Install

```bash
npm install @ailuracode/alpine-toast alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import toast, { toastOptions, toastPositions, toastVariants } from "@ailuracode/alpine-toast";

Alpine.plugin(
  toastOptions({
    variants: toastVariants(["success", "info", "warning", "error", "loading"] as const),
    positions: toastPositions(["top-center", "bottom-right"] as const),
    defaultPosition: "bottom-right",
    promise: {
      loadingVariant: "loading",
      successVariant: "success",
      errorVariant: "error",
    },
  })
);
Alpine.start();
```

`toastOptions()`, `toastVariants()`, and `toastPositions()` preserve literal types for strongly typed payloads and `$toast.<variant>()` shortcuts.

## Magic API

```js
$toast("Hello")
$toast({ title: "Saved", variant: "success", position: "top-center" })
$toast.success("Saved") // only when "success" is in `variants`
$toast.dismiss(id)
$toast.dismissAt("top-center")
$toast.dismissAll()
$toast.fromPayload({ title: "Done", variant: "success" })
await $toast.promise(() => save(), {
  loading: "Saving...",
  success: "Saved",
  error: "Could not save",
})
```

| Method | Description |
|--------|-------------|
| `$toast(title, options?)` | Push a `default` toast. Returns the toast id. |
| `$toast(payload)` | Push with a full payload object. |
| `$toast.<variant>(title, options?)` | One shortcut per entry in `variants`. |
| `$toast.dismiss(id)` | Close one toast by id (returned from `$toast()`). |
| `$toast.update(id, patch)` | Patch the same toast in place (variant, title, content, action, …). |
| `$toast.dismissAt(position)` | Close every toast in one position stack. |
| `$toast.dismissAll()` | Close every toast in every stack. |
| `$toast.fromPayload(payload)` | Push from a plain payload (events, Laravel flash, etc.). |
| `$toast.promise(factoryOrPromise, messages?)` | `loading` → `success` / `error` on the same toast. |

### Payload options

| Field | Type | Default |
|-------|------|---------|
| `content` | `TContent \| null` | `null` |
| `title` | `string \| null` | `null` |
| `description` | `string \| null` | `null` |
| `variant` | `default \| …your variants` | `default` |
| `position` | `bottom-right \| …your positions` | `bottom-right` (or `defaultPosition`) |
| `duration` | `number` (ms) | `4000` (`0` = no auto-dismiss) |
| `action` | `{ label, onClick? }` | `null` |

`title` / `description` are optional string shorthands. Use `content` for any shape your renderer understands (objects, arrays, HTML snippets, etc.). The plugin stores it as-is — rendering is up to your UI.

```ts
type AppToastContent = { user: { name: string; avatar: string } } | { html: string };

type Item = ToastItem<typeof variants, typeof positions, AppToastContent>;

$toast({
  content: { user: { name: "Ada", avatar: "/ada.png" } },
  variant: "success",
});
```

```html
<template x-for="toast in $store.toast.itemsAt(position)" :key="toast.id">
  <div x-show="toast.content?.user">
    <img :src="toast.content.user.avatar" alt="" />
    <span x-text="toast.content.user.name"></span>
  </div>
  <p x-show="toast.title" x-text="toast.title"></p>
</template>
```

For `$toast.promise`, optional `loadingContent`, `successContent`, and `errorContent` update the same toast item.

## Custom variants

```ts
import toast, { toastOptions, toastVariants, type ToastMagic } from "@ailuracode/alpine-toast";

const variants = toastVariants(["queued", "published", "failed"] as const);

Alpine.plugin(toast({ variants }));

type AppToast = ToastMagic<typeof variants>;
// AppToast has .queued(), .published(), .failed()
```

Without `variants`, only `$toast()`, `$toast.promise()`, `$toast.dismiss()`, and `$toast.fromPayload()` are available.

## Custom positions

Each declared position gets its **own stack**. `maxToasts` and `maxVisible` apply **per position**, not globally.

```ts
import toast, { toastPositions, type ToastPosition } from "@ailuracode/alpine-toast";

const positions = toastPositions(["top-center", "bottom-right"] as const);

Alpine.plugin(
  toast({
    positions,
    defaultPosition: "bottom-right",
  })
);

type AppPosition = ToastPosition<typeof positions>;
// "bottom-right" | "top-center"
```

The plugin stores the position id on each toast. Render one stack per position in your UI:

```html
<template x-for="position in $store.toast.stackPositions" :key="position">
  <div
    x-bind:data-position="position"
    x-bind:class="{
      'fixed top-4 left-1/2 -translate-x-1/2': position === 'top-center',
      'fixed bottom-4 right-4': position === 'bottom-right',
    }"
  >
    <template x-for="(toast, index) in $store.toast.itemsAt(position)" :key="toast.id">
      <div x-show="!toast.removed && $store.toast.isVisibleAt(position, index)">
        <p x-text="toast.title"></p>
      </div>
    </template>
  </div>
</template>
```

| Store API | Description |
|-----------|-------------|
| `stackPositions` | All stack keys (`defaultPosition` + `positions`) |
| `itemsAt(position)` | Toasts in that stack, newest first |
| `isVisibleAt(position, index)` | Per-stack visible limit |
| `dismiss(id)` | Close one toast (same as `$toast.dismiss`) |
| `dismissAt(position)` | Close one entire stack |
| `dismissAll()` | Close all stacks |

## Promise flow

Configure default promise variants in plugin options, or override per call:

```js
Alpine.plugin(
  toast({
    variants: toastVariants(["loading", "success", "error"] as const),
    promise: {
      loading: "Loading...",
      error: "Something went wrong",
      loadingVariant: "loading",
      successVariant: "success",
      errorVariant: "error",
      duration: 4000,
    },
  })
);
```

```js
await $toast.promise(() => save(), {
  loading: "Saving...",
  success: (data) => `Saved ${data.id}`,
  error: "Could not save",
});
```

If a named variant is missing from `variants`, promise states fall back to `default`.

On failure, the toast updates to the error state and the returned promise **rejects** with the original error so callers can still use `try/catch` or `.catch()`.

Reserved variant names (`dismiss`, `update`, `dismissAt`, `dismissAll`, `fromPayload`, `promise`) cannot override core `$toast` methods.

In Alpine templates, wrap multi-argument calls in an arrow function:

```html
<button
  @click="() => $toast.promise(() => save(), { loading: 'Saving...', success: 'Saved!' })"
>
  Save
</button>
```

## Queue limits

| Option | Default | Description |
|--------|---------|-------------|
| `maxToasts` | `5` | Maximum toasts kept **per position stack**. `0` = unlimited. |
| `maxVisible` | `maxToasts` | Maximum toasts shown at once **per stack**. |

## Window events

```js
window.dispatchEvent(
  new CustomEvent("toast", {
    detail: { title: "From anywhere", variant: "success", position: "top-center" },
  })
);
```

Disable with `toast({ listenToWindowEvents: false })`.

## Rendering UI

```html
<template x-for="position in $store.toast.stackPositions" :key="position">
  <div
    role="region"
    x-bind:aria-label="'Toasts ' + position"
    x-bind:data-position="position"
  >
    <template x-for="(toast, index) in $store.toast.itemsAt(position)" :key="toast.id">
      <div
        role="status"
        x-show="!toast.removed && $store.toast.isVisibleAt(position, index)"
        x-bind:data-variant="toast.variant"
      >
        <p x-text="toast.title"></p>
      </div>
    </template>
  </div>
</template>
```

Style `[data-variant="…"]` and `[data-position="…"]` in your own CSS or component library.

## Plugin options

```js
Alpine.plugin(
  toast({
    variants: toastVariants(["success", "error"] as const),
    positions: toastPositions(["top-center", "bottom-right"] as const),
    defaultPosition: "bottom-right",
    defaultDuration: 5000,
    maxToasts: 5,
    maxVisible: 3,
    listenToWindowEvents: true,
    storeKey: "toast",
    promise: {
      loadingVariant: "success",
      successVariant: "success",
      errorVariant: "error",
    },
  })
);
```

## Related packages

- [`@ailuracode/alpine-notify`](./notify.md) — OS-level Web Notifications (`$notify`)
