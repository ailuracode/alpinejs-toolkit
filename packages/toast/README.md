# @ailuracode/alpinejs-toast

Headless in-app toast queue for Alpine.js via the `$toast` magic.

**CSS-framework agnostic** — no markup, no styles. Only `default`, `bottom-right`, and `promise` are built into the API; you declare variants and positions your UI needs.

**[Full documentation →](../../docs/plugins/toast.md)**

## Install

```bash
npm install @ailuracode/alpinejs-toast alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import toast, { toastPositions, toastVariants } from "@ailuracode/alpinejs-toast";

Alpine.plugin(
  toast({
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

## License

MIT
