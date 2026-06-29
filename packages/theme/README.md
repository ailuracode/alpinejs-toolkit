# @ailuracode/alpine-theme

Light, dark, and system theme store for Alpine.js. CSS-framework agnostic.

**[Full documentation →](../../docs/plugins/theme.md)**

## Install

```bash
npm install @ailuracode/alpine-theme alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";

Alpine.plugin(theme({
  onChange({ mode, resolved }) {
    document.documentElement.dataset.theme = resolved;
  },
}));

Alpine.start();
```

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>
```

## API summary

| | |
|-|-|
| **Store** | `$store.theme` |
| **State** | `mode`, `resolved` |
| **Getters** | `isLight`, `isDark`, `isSystem`, `isResolvedLight`, `isResolvedDark` |
| **Methods** | `set(mode)`, `cycle()`, `refresh()`, `is(name)`, `isResolved(name)` |
| **Options** | `storageKey`, `onChange({ mode, resolved })` |

**Color scheme:** use `resolved` to style the app. For the OS-only signal, see [`prefersColorScheme` in alpine-media](../../docs/plugins/media.md#theme-vs-media-color-scheme) — the two can differ when the user overrides system preference.

## License

MIT
