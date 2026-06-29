---
title: "Theme"
description: "Package: @ailuracode/alpine-theme"
---

Package: `@ailuracode/alpine-theme`

Manages light, dark, and system theme preference with `localStorage` persistence. CSS-framework agnostic — you control how the theme is applied to the DOM.

## Install

```bash
npm install @ailuracode/alpine-theme alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";

Alpine.plugin(theme({
  storageKey: "theme", // optional, default: "theme"
  onChange({ mode, resolved }) {
    // mode: user preference (light | dark | system)
    // resolved: actually applied theme (light | dark)
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  },
}));

Alpine.start();
```

`onChange` runs on bootstrap (before paint if registered early) and whenever the theme changes.

## Store API

### State

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `string` | User preference: `light`, `dark`, or `system` |
| `resolved` | `string` | Applied theme: `light` or `dark` |

### Getters

| Getter | Description |
|--------|-------------|
| `isLight` | `mode === 'light'` |
| `isDark` | `mode === 'dark'` |
| `isSystem` | `mode === 'system'` |
| `isResolvedLight` | `resolved === 'light'` |
| `isResolvedDark` | `resolved === 'dark'` |

### Methods

| Method | Description |
|--------|-------------|
| `set(mode)` | Set preference and persist to `localStorage` |
| `cycle()` | Rotate: light → dark → system → light |
| `refresh()` | Re-resolve `resolved` (e.g. after OS theme change) |
| `is(name)` | Generic: `is('dark')` |
| `isResolved(name)` | Generic: `isResolved('light')` |

## HTML examples

```html
<button :class="{ active: $store.theme.isLight }" @click="$store.theme.set('light')">
  Light
</button>
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>
<button :class="{ active: $store.theme.isSystem }" @click="$store.theme.set('system')">
  System
</button>

<p>Preference: <span x-text="$store.theme.mode"></span></p>
<p>Applied: <span x-text="$store.theme.resolved"></span></p>
```

## System preference

When `mode` is `system`, the plugin listens to `prefers-color-scheme` and updates `resolved` automatically. No extra setup required.

## `resolved` vs `prefersColorScheme`

Both relate to light/dark, but they answer different questions:

| | `$store.theme.resolved` | `$store.media.prefersColorScheme` |
|---|---|---|
| **Package** | `@ailuracode/alpine-theme` | `@ailuracode/alpine-media` |
| **Source** | User preference (`mode`) + OS when `mode === 'system'` | OS only, via `matchMedia` |
| **Mutable** | Yes — `set('dark')` changes `resolved` | No — read-only environment signal |
| **Use for** | Applying styles (`onChange`, classes, `color-scheme`) | Detecting OS preference regardless of user override |

They can differ. A user can force dark mode while the OS prefers light:

```js
$store.theme.mode               // 'dark'
$store.theme.resolved           // 'dark'
$store.media.prefersColorScheme // 'light' (OS still prefers light)
```

**Rule of thumb:**

- **Styling the app** → `$store.theme.resolved` (or `isResolvedDark` / `isResolvedLight`)
- **OS environment signal** (analytics, conditional copy, “match system” UI hints) → `$store.media.prefersColorScheme`

If you only use `@ailuracode/alpine-theme`, `resolved` is enough for most apps. Add `@ailuracode/alpine-media` when you also need viewport breakpoints or other media features.

```html
<!-- Apply theme to the UI -->
<div :class="{ 'dark': $store.theme.isResolvedDark }">...</div>

<!-- Show OS preference only when user chose "system" -->
<p x-show="$store.theme.isSystem">
  System preference: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

See also [Media — theme vs media color scheme](./media.md#theme-vs-media-color-scheme).

## FOUC prevention

Register the plugin and `onChange` as early as possible in your entry file. The plugin bootstraps on registration (before `Alpine.start()`) so `onChange` can run before first paint.

For critical styles, add inline CSS in `<head>` keyed to your chosen attribute (e.g. `[data-theme="dark"]`).

## Tailwind CSS

```js
onChange({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}
```

Enable class-based dark mode in `tailwind.config.js`.
