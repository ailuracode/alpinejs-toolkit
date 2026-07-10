# @ailuracode/alpine-toast

Headless in-app toast queue for Alpine.js via the `$toast` magic.

**CSS-framework agnostic** — no markup, no styles. Only `default`, `bottom-right`, and `promise` are built into the API; you declare variants and positions your UI needs.

**[Full documentation →](../../docs/plugins/toast.md)**

## Install

```bash
pnpm add @ailuracode/alpine-toast alpinejs
```

## Quick example

```ts
import Alpine from "alpinejs";
import { toastPlugin, toastVariants, toastPositions } from "@ailuracode/alpine-toast";

Alpine.plugin(
  toastPlugin({
    variants: toastVariants(["success", "error", "loading"] as const),
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

```html
<button @click="$toast('Hello')">Default</button>
<button @click="$toast.success('Saved')">Success</button>
<button @click="$toast('Notice', { position: 'top-center' })">Top</button>
<button @click="() => $toast.promise(save, { loading: 'Saving...', success: 'Saved!' })">
  Save
</button>
```

```html
<button @click="$toast.dismiss(toast.id)" aria-label="Close">✕</button>
```

Also available on the store: `$store.toast.dismiss(id)`.

## API summary

| | |
|-|-|
| **Content** | `content` on each toast — any type your UI renders |
| **Magic** | `$toast(title, options?)` → toast id (`default` variant, `bottom-right` position) |
| **Close** | `$toast.dismiss(id)`, `$toast.dismissAt(position)`, `$toast.dismissAll()` |
| **Dedupe** | `$toast.pushUnique(key, payload)` — one active toast per key (undo flows) |
| **Promise** | `$toast.promise(factoryOrPromise, messages?)` |
| **Variants** | `variants: toastVariants([...])` → `$toast.<name>()` |
| **Positions** | `positions: toastPositions([...])` → one stack per position |
| **Queue** | `maxToasts` / `maxVisible` per timed or persistent stack |
| **UI** | Bring your own markup and CSS |

## Standalone usage (no Alpine)

```ts
import { createToastController } from "@ailuracode/alpine-toast";

const controller = createToastController({
  maxToasts: 5,
  maxVisible: 3,
});

controller.push({ content: "Hello!", variant: "default", position: "bottom-right" });
controller.dismissAll();
controller.destroy();
```

## Plugin options

```ts
toastPlugin({
  variants?: string[],           // toastVariants([...])
  positions?: string[],          // toastPositions([...])
  defaultPosition?: string,      // default: "bottom-right"
  defaultDuration?: number,      // default: 5000 (ms), false for persistent
  maxToasts?: number,            // max toasts per position
  maxVisible?: number,            // max visible per position
  promise?: {
    loadingVariant?: string,
    successVariant?: string,
    errorVariant?: string,
    loadingMessages?: string[],
  },
  onDismiss?: (id: string) => void,
  onChange?: (detail: ToastChangeDetail) => void,
});
```

## Store API

```ts
$store.toast.items           // active toast items
$store.toast.length          // total count
$store.toast.push(payload)   // add a toast, returns id
$store.toast.dismiss(id)     // remove by id
$store.toast.dismissAt(position) // remove all at position
$store.toast.dismissAll()    // remove all
```

## License

MIT
