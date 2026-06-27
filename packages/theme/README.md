# @ailuracode/alpinejs-theme

Light, dark, and system theme store for Alpine.js. CSS-framework agnostic.

**[Full documentation →](../../docs/plugins/theme.md)**

## Install

```bash
npm install @ailuracode/alpinejs-theme alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpinejs-theme";

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

## License

MIT
