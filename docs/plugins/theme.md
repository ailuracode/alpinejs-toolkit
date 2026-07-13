---
title: "Theme"
description: "Package: @ailuracode/alpine-theme"
---

Package: `@ailuracode/alpine-theme`

Manages light, dark, and system theme preference with `localStorage` persistence, cross-tab sync, and a pluggable DOM strategy. The state is split into three orthogonal fields — `current` (user choice), `system` (OS preference), and `resolved` (effective value) — and exposed reactively via `$store.theme` and the `$theme` magic.

## Install

```bash
pnpm install @ailuracode/alpine-theme @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## State model

Three independent observables on `$store.theme`:

| Field      | Meaning                                 | Values                          |
| ---------- | --------------------------------------- | ------------------------------- |
| `current`  | The user selection                      | `'light' \| 'dark' \| 'system'` |
| `system`   | OS preference, updated live via `matchMedia` | `'light' \| 'dark'`             |
| `resolved` | Effective theme applied to the page     | `'light' \| 'dark'`             |

Examples:

- User picked `system`, OS is dark → `current='system'`, `system='dark'`, `resolved='dark'`.
- User picked `light`, OS is dark → `current='light'`, `system='dark'`, `resolved='light'`.
- User picked `dark`, OS is light → `current='dark'`, `system='light'`, `resolved='dark'`.

`resolved` updates automatically when the OS flips **only** when `current === 'system'`. An explicit user choice (`light` / `dark`) freezes `resolved` against OS changes.

## Setup

The plugin applies the theme to `<html>` by default. Pick one of the two built-in strategies.

### Class strategy (default — Tailwind, shadcn)

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";

Alpine.plugin(themePlugin({
  strategy: "class",      // default
  darkClass: "dark",
  lightClass: "light",
  defaultTheme: "system", // optional, default: "system"
  storageKey: "theme",    // optional, default: "theme"
}));

Alpine.start();
```

```html
<html class="dark"></html>
```

### Attribute strategy

```js
Alpine.plugin(themePlugin({ strategy: "attribute", attribute: "data-theme" }));
```

```html
<html data-theme="dark"></html>
```

The plugin bootstraps on registration (before `Alpine.start()`) so the resolved theme is in the DOM before first paint.

## Store API

### State (read directly — no getters required)

```html
<p>Choice:   <span x-text="$store.theme.current"></span></p>
<p>OS:       <span x-text="$store.theme.system"></span></p>
<p>Applied:  <span x-text="$store.theme.resolved"></span></p>

<button :class="{ active: $store.theme.current === 'light' }" @click="$store.theme.set('light')">Light</button>
<button :class="{ active: $store.theme.current === 'dark' }" @click="$store.theme.set('dark')">Dark</button>
<button :class="{ active: $store.theme.current === 'system' }" @click="$store.theme.set('system')">System</button>
```

Direct comparisons read better than a getter-per-value API and keep the store surface minimal.

### Methods

| Method             | Description                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `set(value)`       | Sets a new preference (`'light' \| 'dark' \| 'system'`). Persists, recomputes, and applies.                              |
| `toggle()`         | Flips between `light` and `dark` based on the resolved theme. Calling it creates an **explicit** preference — it does NOT return to `'system'`. |
| `reset()`          | Resets to the configured default and removes the persisted value.                                                         |
| `apply()`          | Re-applies the currently resolved theme to the DOM, bypassing the strategy's cache. Use after external `<html>` mutations (Astro view transitions, browser extensions, hot reloads). |

### Change events

Subscribe to the `change` event on the manager — useful for analytics, mirroring to a server, or updating UI outside of Alpine:

```js
import { themePlugin, createTheme } from "@ailuracode/alpine-theme";

const manager = createTheme({ strategy: "class" });
manager.on("change", (detail) => {
  // detail: { current, system, resolved, source, previous }
  // source: "initialization" | "user" | "system" | "storage" | "reset"
  console.log(detail.source, detail.previous?.resolved, "→", detail.resolved);
});
```

Inside an Alpine x-data, read `$store.theme` reactively instead — Alpine does the subscription for you.

## `resolved` vs `prefersColorScheme`

Both relate to light/dark but answer different questions:

|                                | `$store.theme.resolved`              | `$store.media.prefersColorScheme` |
| ------------------------------ | ------------------------------------ | --------------------------------- |
| **Package**                    | `@ailuracode/alpine-theme`           | `@ailuracode/alpine-media`        |
| **Source**                     | User preference + OS when `current === 'system'` | OS only, via `matchMedia`         |
| **Mutable**                    | Yes — `set('dark')` changes it       | No — read-only environment signal |
| **Use for**                    | Applying styles (classes, `color-scheme`) | Detecting OS preference regardless of user override |

They can differ — a user can force dark mode while the OS prefers light:

```js
$store.theme.current            // 'dark'
$store.theme.resolved           // 'dark'
$store.media.prefersColorScheme // 'light' (OS still prefers light)
```

**Rule of thumb:**

- **Styling the app** → `$store.theme.resolved`
- **OS environment signal** (analytics, conditional copy, "match system" hints) → `$store.media.prefersColorScheme`

If you only use `@ailuracode/alpine-theme`, `resolved` is enough for most apps. Add `@ailuracode/alpine-media` when you also need viewport breakpoints or other media features.

```html
<!-- Apply the theme -->
<div :class="{ 'dark': $store.theme.resolved === 'dark' }">…</div>

<!-- Show OS preference only when the user chose "system" -->
<p x-show="$store.theme.current === 'system'">
  System preference: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

See also [Media — theme vs media color scheme](./media.md#theme-vs-media-color-scheme).

## FOUC prevention

For pages without server-side rendering, add an inline head snippet that reads `localStorage` and applies the class / attribute **before** Alpine loads:

```html
<head>
  <script>
    // Tune `key` / `className` to your config.
    const key = "theme";
    const saved = localStorage.getItem(key);
    const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = mode === "system" ? (dark ? "dark" : "light") : mode;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.style.colorScheme = resolved;
  </script>
</head>
```

For Alpine-managed apps the plugin does this for you on registration, but the inline snippet is still the only way to avoid a flash on slow connections.

## Tailwind CSS

The default class strategy is Tailwind-ready out of the box:

```js
Alpine.plugin(themePlugin({ strategy: "class", darkClass: "dark" }));
```

Make sure dark mode is class-based in your `tailwind.config`:

```js
export default {
  darkMode: "class",
  // …
};
```

```html
<html class="dark">
  <body class="bg-white dark:bg-black text-black dark:text-white">
    <button @click="$store.theme.toggle()">Toggle theme</button>
  </body>
</html>
```

## Migration from `@ailuracode/alpine-theme@0.x`

| `0.x`                                                          | `1.x`                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Single `mode` field                                            | Three independent fields: `current` / `system` / `resolved`                                 |
| `isLight` / `isDark` / `isSystem` / `isResolvedLight` / `isResolvedDark` getters | Dropped — read `$store.theme.current` / `.resolved` directly and compare                    |
| `set(mode)` / `cycle()` / `refresh()`                          | `set(value)` / `toggle()` / `reset()`. `cycle()` and `refresh()` are gone.                  |
| `onChange` callback in `themePlugin(options)`                  | `manager.on('change', listener)`. Subscribe after `createTheme()` if you need the callback. |
| Single `localStorage` adapter                                 | Pluggable `ThemeStorage` — pass `createLocalStorageThemeStorage({ key })` to keep defaults. |
