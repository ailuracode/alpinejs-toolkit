---
title: "Getting started"
description: "Install the modular Alpine toolkit and register feature plugins."
---

## Requirements

- [Alpine.js](https://alpinejs.dev/) v3+
- A bundler with ESM support ([Vite](https://vite.dev/), Webpack, etc.) or native ES modules

## Install essentials

Start with the core primitives and the five essential modules:

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

## Direct registration (recommended for most apps)

Every feature plugin is a plain Alpine callback. Register them in your
app entry, then start Alpine:

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";
import { mediaPlugin } from "@ailuracode/alpine-media";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(themePlugin());
Alpine.plugin(mediaPlugin());
Alpine.plugin(scrollPlugin());

Alpine.start();
```

`@ailuracode/alpine-core` ships the
[registration guards](./core.md#registration-guards) so a second plugin
that asks for `$store.theme` throws `RegistrationError` instead of
silently overwriting the host's store.

## Code splitting (dynamic `import()`)

If your bundler splits dynamic imports into separate chunks, register
heavy plugins through a thin wrapper that resolves the chunk lazily:

```js
import Alpine from "alpinejs";

const plugins = [
  () => import("@ailuracode/alpine-theme").then((m) => m.themePlugin()),
  () => import("@ailuracode/alpine-media").then((m) => m.mediaPlugin()),
  () => import("@ailuracode/alpine-toast").then((m) => m.toastPlugin()),
];

await Promise.all(plugins.map((load) => load().then((p) => Alpine.plugin(p))));

Alpine.start();
```

This gives you code-splitting without a dedicated registry abstraction —
the feature plugins themselves stay Alpine callbacks, which keeps them
discoverable and easy to test.

## Direct HTML usage

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

Alpine silently overwrites whatever a previous plugin registered under
the same key. Toolkit feature plugins guard their registrations through
`@ailuracode/alpine-core` and throw `RegistrationError("REGISTRATION_COLLISION")`
instead of clobbering the host's store or magic.

If the host already owns a name (own `$store.theme`, sibling toolkit
plugin registered `$store.toast`, etc.) the recommended fix is renaming
the integration surface, not overriding:

```js
Alpine.plugin(themePlugin({ storeKey: "appearance" })); // → $store.appearance
Alpine.plugin(toastPlugin({ magicKey: "notify" }));     // → $notify
```

Feature plugin options accept `storeKey` / `magicKey` (and the matching
one for directives) for exactly this case. The escape hatch is the
`{ override: true }` option on `guardStore` / `guardMagic` /
`guardDirective`, but prefer renaming — silent overwrites are the bug
class this guard exists to catch.

See [Core — Avoiding name collisions](./core.md#registration-guards) for
the full API and the `architecture:check` rule that enforces it.

## Next steps

- [Core](./core.md) — registration guards, singleton registry, and the controller bridge
- Essentials — [theme](./plugins/theme.md), [media](./plugins/media.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md)
- Headless UI — [toast](./plugins/toast.md), [dialog](./plugins/dialog.md), [menu](./plugins/menu.md), [tooltip](./plugins/tooltip.md)
- [Playground](/playground/) — interactive demos
