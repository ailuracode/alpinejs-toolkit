# Architecture: stores vs magics

This monorepo follows Alpine.js conventions and splits plugins into two categories.

## Stores (`Alpine.store`)

Use a **store** when you need:

- **Shared mutable state** across multiple components
- **Actions** that change global state or the DOM (`set`, `lock`, `cycle`)
- **Coordination** between distant parts of the UI (e.g. modal + scroll lock)

| Package | Store name | Purpose |
|---------|------------|---------|
| `@ailuracode/alpine-theme` | `$store.theme` | User theme preference + persistence |
| `@ailuracode/alpine-screen` | `$store.device` | Breakpoints and viewport width |
| `@ailuracode/alpine-scroll` | `$store.scroll` | Scroll metrics + body lock |

### Template usage

```html
<p x-text="$store.theme.mode"></p>
<p x-text="$store.device.width"></p>
<button @click="$store.scroll.lock()">Lock scroll</button>
```

### Getters vs methods

Boolean derived state uses **getters** (no parentheses):

```html
<div x-show="$store.theme.isDark"></div>
<div x-show="$store.scroll.showToTop"></div>
```

Actions and parameterized checks use **methods**:

```html
<button @click="$store.theme.set('light')">Light</button>
<span x-show="$store.device.is('tablet')"></span>
```

## Magics (`Alpine.magic`)

Use a **magic** when you need:

- **Read-only environment state** (connectivity, pointer type)
- **One-off utilities** without global UI state (copy to clipboard)
- No cross-component write coordination

| Package | Magic | Purpose |
|---------|-------|---------|
| `@ailuracode/alpine-network` | `$network` | `navigator.onLine` |
| `@ailuracode/alpine-touch` | `$touch` | Pointer / touch capabilities |
| `@ailuracode/alpine-clipboard` | `$clipboard` | Async copy function |
| `@ailuracode/alpine-notify` | `$notify` | Web Notifications API |
| `@ailuracode/alpine-fullscreen` | `$fullscreen` | Fullscreen API |

### Template usage

```html
<div x-show="!$network.isOnline">Offline</div>
<p x-text="$touch.maxTouchPoints"></p>
<button @click="await $clipboard(url)">Copy URL</button>

<button @click="$notify.sendIfPermitted('Saved')">Notify</button>
<button @click="$fullscreen.toggle($el)">Fullscreen</button>
```

### Naming convention

Magics expose a namespace object with descriptive boolean properties:

- `$network.isOnline` — not `$network.online`
- `$touch.isTouch` — consistent `is*` pattern

## CSS framework agnostic

Plugins do **not** assume Tailwind, shadcn, or any CSS framework.

- **Theme** — only manages state; you apply styles via `onChange`
- **Scroll lock** — adds `.scroll-locked` classes; you define the CSS
- **Screen / network / touch** — no DOM styling

### Theme example (Tailwind)

```js
Alpine.plugin(theme({
  onChange({ resolved }) {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  },
}));
```

### Theme example (data attribute)

```js
Alpine.plugin(theme({
  onChange({ resolved }) {
    document.documentElement.dataset.theme = resolved;
  },
}));
```

```css
[data-theme="dark"] {
  --bg: #09090b;
}
```

## What is not included

These packages intentionally avoid React-style patterns:

- No `use*` hook naming
- No framework-specific DOM attributes baked into plugins
- Each package is independently installable and tree-shakeable by import
