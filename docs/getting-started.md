---
title: "Getting started"
description: "Install the modular Alpine toolkit — lazy init, essentials, and TypeScript."
---

## Requirements

- [Alpine.js](https://alpinejs.dev/) v3+
- A bundler with ESM support ([Vite](https://vite.dev/), Webpack, etc.) or native ES modules

## Install essentials

Start with the core registry and the five essential modules:

```bash
npm install alpinejs \
  @ailuracode/alpinejs-core \
  @ailuracode/alpinejs-theme \
  @ailuracode/alpinejs-screen \
  @ailuracode/alpinejs-scroll \
  @ailuracode/alpinejs-sidebar \
  @ailuracode/alpinejs-toast
```

Add more packages later — each one is an independent npm dependency.

## Lazy init (recommended)

Register plugins in your app entry (`main.js`, `app.ts`, etc.). Only the plugins you initialize are loaded along the import paths you use:

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineStorePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpinejs-core";

function applyTheme({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

registerPlugin(
  "theme",
  defineStorePlugin(["theme"], async () => {
    const { default: theme } = await import("@ailuracode/alpinejs-theme");
    return theme({ onChange: applyTheme });
  })
);

registerPlugin(
  "toast",
  lazyPlugin({
    kind: "magic",
    magics: ["toast"],
    import: () => import("@ailuracode/alpinejs-toast"),
  })
);

registerPlugin("screen", lazyPlugin({
  kind: "store",
  stores: ["device"],
  import: () => import("@ailuracode/alpinejs-screen"),
}));

Alpine.plugin(createAlpinePlugin(["theme", "toast", "screen"]));
Alpine.start();
```

## Lazy initialization

[`@ailuracode/alpinejs-core`](./core.md) separates **registration** (no side effects) from **initialization** (runs Alpine plugin callbacks):

```js
import Alpine from "alpinejs";
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpinejs-core";

registerPlugin(
  "scroll",
  lazyPlugin({
    kind: "store",
    stores: ["scroll"],
    import: () => import("@ailuracode/alpinejs-scroll"),
  })
);

await initPlugins(Alpine, "scroll");
Alpine.start();
```

Use `createAlpinePlugin()` when you prefer the standard `Alpine.plugin()` bridge. Use `initPlugins()` directly in async entrypoints (SSR hydration, route-based loading).

See [Core](./core.md) for sync init, plugin kinds, and factory plugins like `theme({ onChange })`.

## Direct registration (simple apps)

If you do not need lazy loading yet, register plugins directly — still **before** `Alpine.start()`:

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpinejs-theme";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(screen);

Alpine.start();
```

Migrate to the core registry when you want code-splitting or a single init pipeline.

## Using in HTML

### Stores

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>

<div x-show="$store.device.isMobile">Mobile layout</div>

<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  Back to top
</button>
```

### Magics

```html
<button @click="$toast('Changes saved', { variant: 'success' })">Notify</button>
```

Push a plain payload from server-rendered data or events:

```html
<div
  x-data
  x-init="$toast.fromPayload({ title: 'Saved', variant: 'success' })"
></div>
```

See [`$toast.fromPayload`](./plugins/toast.md) for the full payload shape.

## Package tiers

| Tier | Packages | When to add |
|------|----------|-------------|
| **Essentials** | theme, screen, scroll, sidebar, toast | Most Alpine apps |
| **Extended** | network, visibility, clipboard, platform, touch, toggle | Connectivity, clipboard, device hints |
| **Advanced** | geo, battery, export, share, attention, notify, calendar, json-api | Specialized browser APIs |
| **Query** | query + adapter + devtools | Client-side data cache (see [Query](./query.md)) |

## CDN

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import theme from "https://esm.sh/@ailuracode/alpinejs-theme";

  Alpine.plugin(theme({ onChange: ({ resolved }) => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }}));
  Alpine.start();
</script>
```

## TypeScript

Each package ships `dist/index.d.ts` (imports) and `dist/global.d.ts` (Alpine augmentations):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpinejs-core" />
/// <reference types="@ailuracode/alpinejs-theme" />
/// <reference types="@ailuracode/alpinejs-toast" />
```

Or import the plugin module — generated types augment globals automatically.

## Next steps

- [Core](./core.md) — lazy registry and dynamic imports
- Essentials — [theme](./plugins/theme.md), [screen](./plugins/screen.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md), [toast](./plugins/toast.md)
- [Playground](/playground/) — interactive demos
