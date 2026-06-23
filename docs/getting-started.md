# Getting started

## Requirements

- [Alpine.js](https://alpinejs.dev/) v3+
- A bundler with ESM support (Vite, Webpack, etc.) or native ES modules in the browser

## Installation

Install Alpine.js and one or more packages:

```bash
npm install alpinejs @ailuracode/alpine-theme @ailuracode/alpine-screen
```

## Registration

Register plugins **before** `Alpine.start()`:

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";
import screen from "@ailuracode/alpine-screen";
import network from "@ailuracode/alpine-network";

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(screen);
Alpine.plugin(network);

Alpine.start();
```

Some plugins accept options (e.g. `theme`). Others are plain functions:

```js
Alpine.plugin(screen);
Alpine.plugin(network);
```

## Using in HTML

### Stores

Access global reactive state with `$store`:

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>

<div x-show="$store.device.isMobile">Mobile layout</div>
```

### Magics

Read environment state or call utilities directly:

```html
<div x-show="!$network.isOnline">You are offline</div>

<div x-show="!$visibility.isVisible">Tab is in the background</div>

<div x-show="$battery.isAvailable">
  Battery: <span x-text="Math.round($battery.level * 100)"></span>%
</div>

<button @click="await $clipboard('Hello')">Copy</button>

<p x-show="$touch.isTouch">Touch-optimized UI</p>

<button @click="$notify.sendIfPermitted('Task complete')">Notify</button>
```

## Combining packages

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";
import scroll from "@ailuracode/alpine-scroll";

function applyTheme({ resolved }) {
  document.documentElement.dataset.theme = resolved;
}

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(scroll);

Alpine.start();
```

```html
<div
  class="progress"
  :style="`width: ${$store.scroll.progress}%`"
></div>

<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  Back to top
</button>
```

## CDN

Load plugins from a CDN (e.g. [esm.sh](https://esm.sh)) with native ES modules:

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import clipboard from "https://esm.sh/@ailuracode/alpine-clipboard";

  Alpine.plugin(clipboard);
  Alpine.start();
</script>
```

[esm.sh](https://esm.sh) serves the `X-TypeScript-Types` header for editor support when you import from it.

## TypeScript

Install `@types/alpinejs` (or add it as a dev dependency). Each package ships two declaration files:

| File | Purpose |
|------|---------|
| `dist/index.d.ts` | Module import (`import clipboard from "…"`) |
| `dist/global.d.ts` | Ambient augmentations for `$clipboard`, `$store.theme`, etc. |

### npm projects

Reference plugin types in your app entry (e.g. `src/env.d.ts`):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-clipboard" />
/// <reference types="@ailuracode/alpine-theme" />
```

Or import the plugin module — the generated `index.d.ts` also augments Alpine globals:

```ts
import clipboard from "@ailuracode/alpine-clipboard";
```

### CDN projects (no runtime npm install)

**Option A — esm.sh (recommended):** import from [esm.sh](https://esm.sh). VS Code reads the `X-TypeScript-Types` response header automatically.

**Option B — types as dev dependencies** (CDN for runtime, npm only for the editor):

```bash
npm install -D @types/alpinejs @ailuracode/alpine-clipboard
```

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-clipboard" />
```

**Option C — copy `global.d.ts`** from unpkg into your project (e.g. `src/types/alpine-clipboard.d.ts`) and reference it with `/// <reference path="./types/alpine-clipboard.d.ts" />`.

`global.d.ts` has no `import` statements, so it resolves without pulling the full package into `node_modules` at runtime.

## Next steps

- [Architecture: stores vs magics](./architecture.md) — when to use each pattern
- Individual package docs: [theme](./theme.md), [screen](./screen.md), [network](./network.md), [visibility](./visibility.md), [battery](./battery.md), [clipboard](./clipboard.md), [export](./export.md), [scroll](./scroll.md), [touch](./touch.md), [platform](./platform.md), [notify](./notify.md), [geo](./geo.md), [share](./share.md)
