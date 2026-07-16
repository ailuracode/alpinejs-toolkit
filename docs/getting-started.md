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
pnpm add alpinejs \
  @ailuracode/alpine-core \
  @ailuracode/alpine-ui \
  @ailuracode/alpine-theme \
  @ailuracode/alpine-toggle \
  @ailuracode/alpine-media \
  @ailuracode/alpine-scroll \
  @ailuracode/alpine-sidebar \
  @ailuracode/alpine-toast
```

Add more packages later — each one is an independent npm dependency.

## Lazy init (recommended)

Register plugins in your app entry (`main.js`, `app.ts`, etc.). Only the plugins you initialize are loaded along the import paths you use:

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: () => themePlugin(),
  })
);

registerPlugin(
  "toast",
  lazyPlugin(["magic"], {
    names: ["toast"],
    import: () => import("@ailuracode/alpine-toast"),
  })
);

registerPlugin(
  "media",
  lazyPlugin(["store"], {
    names: ["media"],
    import: () => import("@ailuracode/alpine-media"),
  })
);

Alpine.plugin(createAlpinePlugin(["theme", "toast", "media"]));
Alpine.start();
```

## Lazy initialization

[`@ailuracode/alpine-core`](./core.md) separates **registration** (no side effects) from **initialization** (runs Alpine plugin callbacks):

```js
import Alpine from "alpinejs";
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "scroll",
  lazyPlugin(["store"], {
    names: ["scroll"],
    import: () => import("@ailuracode/alpine-scroll"),
  })
);

await initPlugins(Alpine, "scroll");
Alpine.start();
```

Use `createAlpinePlugin()` when you prefer the standard `Alpine.plugin()` bridge. Use `initPlugins()` directly in async entrypoints (SSR hydration, route-based loading).

See [Core](./core.md) for sync init, plugin kinds, and factory plugins like `themePlugin()`.

## Direct registration (simple apps)

If you do not need lazy loading yet, register plugins directly — still **before** `Alpine.start()`:

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";
import { media } from "@ailuracode/alpine-media";

Alpine.plugin(themePlugin());
Alpine.plugin(media);

Alpine.start();
```

Migrate to the core registry when you want code-splitting or a single init pipeline.

To react to theme transitions, subscribe through the `Alpine.store("theme")` instance and apply classes yourself — the package is intentionally CSS-framework agnostic:

```js
Alpine.store("theme").on("change", (detail) => {
  document.documentElement.classList.toggle("dark", detail.resolved === "dark");
});
```

## Using in HTML

### Stores

```html
<button @click="$store.theme.set('dark')">Dark</button>
<button @click="$store.theme.set('light')">Light</button>
<button @click="$store.theme.set('system')">System</button>
<button @click="$store.theme.toggle()">Toggle</button>

<div x-show="$store.media.matches('mobile')">Mobile layout</div>

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
| **Essentials** | theme, media, scroll, sidebar | Most Alpine apps |
| **Headless UI** | dialog, menu, tooltip, toast, tabs, accordion, command, carousel | Accessible UI you style yourself |
| **Extended** | network, attention, clipboard, platform, toggle | Connectivity, clipboard, device hints |
| **Advanced** | geo, battery, export, share, attention, notify, calendar, json-api | Specialized browser APIs |
| **Query** | query + adapter + devtools | Client-side data cache (see [Query](./query.md)) |

## CDN

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import { themePlugin } from "https://esm.sh/@ailuracode/alpine-theme";

  Alpine.plugin(themePlugin());
  Alpine.start();
</script>
```

To react to theme transitions from a CDN snippet:

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import { themePlugin } from "https://esm.sh/@ailuracode/alpine-theme";

  Alpine.plugin(themePlugin());
  Alpine.start();

  // Apply classes via the $theme magic once Alpine is ready
  document.addEventListener("alpine:init", () => {
    Alpine.store("theme").on("change", (detail) => {
      document.documentElement.classList.toggle("dark", detail.resolved === "dark");
    });
  });
</script>
```

## TypeScript

Each package ships `dist/index.d.ts` (imports) and `dist/global.d.ts` (Alpine augmentations):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-theme" />
/// <reference types="@ailuracode/alpine-toast" />
```

Or import the plugin module — generated types augment globals automatically.

## Avoiding name collisions

Alpine silently overwrites whatever a previous plugin registered under the same key. Toolkit feature plugins guard their registrations through `@ailuracode/alpine-core` and throw `RegistrationError("REGISTRATION_COLLISION")` instead of clobbering the host's store or magic.

If the host already owns a name (own `$store.theme`, sibling toolkit plugin registered `$store.toast`, etc.) the recommended fix is renaming the integration surface, not overriding:

```js
Alpine.plugin(themePlugin({ storeKey: "appearance" })); // → $store.appearance
Alpine.plugin(toastPlugin({ magicKey: "notify" }));     // → $notify
```

Feature plugin options accept `storeKey` / `magicKey` (and the matching one for directives) for exactly this case. The escape hatch is the global flag `registrationOverride: true` on the bridge helpers exposed by `@ailuracode/alpine-core`, but prefer renaming — silent overwrites are the bug class this guard exists to catch.

See [Core — Avoiding name collisions](./core.md#avoiding-name-collisions) for the full API and the `architecture:check` rule that enforces it.

## Next steps

- [Core](./core.md) — lazy registry and dynamic imports
- Essentials — [theme](./plugins/theme.md), [media](./plugins/media.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md)
- Headless UI — [toast](./plugins/toast.md), [dialog](./plugins/dialog.md), [menu](./plugins/menu.md), [tooltip](./plugins/tooltip.md)
- [Playground](/playground/) — interactive demos
