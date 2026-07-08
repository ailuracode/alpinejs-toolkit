# @ailuracode/alpine-lang

Language store for Alpine.js. Detect the browser language, query the current application language, and change it dynamically — all reactive.

This plugin **does not translate content**. It only owns the current language tag so your i18n library, components, and templates can react to it.

**[Full documentation →](../../docs/plugins/lang.md)**

## Install

```bash
npm install @ailuracode/alpine-lang alpinejs
```

## Quick example

```js
import Alpine from "alpinejs";
import { langPlugin, createLang } from "@ailuracode/alpine-lang";

Alpine.plugin(langPlugin({
  fallback: "en",
  normalize: true,
}));

// Optionally react to changes (load translations, sync <html lang>, persist…)
const lang = createLang({ fallback: "en" });
lang.on("change", (detail) => {
  document.documentElement.lang = detail.current;
});

Alpine.start();
```

```html
<p x-show="$store.lang.is('es')">Hola mundo</p>
<p x-show="$store.lang.is('en')">Hello world</p>

<button @click="$store.lang.set('es')">Español</button>
<button @click="$store.lang.set('en')">English</button>
```

## API summary

| | |
|-|-|
| **Store** | `$store.lang` |
| **Magic** | `$lang` |
| **State** | `current`, `base`, `region`, `languages`, `fallback`, `isDetected` |
| **Methods** | `is(value)`, `includes(value)`, `set(language)`, `reset()` |
| **Options** | `fallback`, `normalize` |
| **Events** | `manager.on("change", detail)` → `LangChangeDetail` (`source`, `previous`, snapshot fields) |
| **Headless** | `createLang(options)` → `LangController` (singleton per document) |

## License

MIT
