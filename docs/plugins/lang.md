---
title: "Lang"
description: "Package: @ailuracode/alpine-lang"
---

Package: `@ailuracode/alpine-lang`

Reactive current-language store for Alpine.js. Detects the browser language, exposes `current` / `base` / `region` plus the full `navigator.languages` list, and lets you change the language dynamically so every Alpine expression reacts in real time.

The plugin **only manages the current language** — it does not translate content. Pair it with any i18n library (i18next, vue-i18n-style helpers, plain dictionaries, etc.) and react to language changes through the manager's typed `change` event.

## Install

```bash
pnpm install @ailuracode/alpine-lang alpinejs
```

## Setup

```js
import Alpine from "alpinejs";
import { langPlugin, createLang } from "@ailuracode/alpine-lang";

Alpine.plugin(langPlugin({
  fallback: "en",    // used when navigator.language / navigator.languages are unavailable
  normalize: true,   // lower-case + normalize "_" to "-"
}));

Alpine.start();
```

The plugin registers `$store.lang` and the `$lang` magic. Both expose the same six reactive fields plus the four commands (`is` / `includes` / `set` / `reset`).

## Store API

### State

| Property | Type | Description |
|----------|------|-------------|
| `current` | `string` | Normalized full language tag (e.g. `"es-ec"`) |
| `base` | `string` | Base subtag of the current language (e.g. `"es"`); equals `current` when no region is present |
| `region` | `string \| null` | Region subtag (e.g. `"ec"`); `null` when no region is present |
| `languages` | `readonly string[]` | Snapshot of `navigator.languages`, normalized |
| `fallback` | `string` | Configured fallback (normalized when `normalize: true`) |
| `isDetected` | `boolean` | `true` when the initial language came from `navigator` |

### Methods

| Method | Description |
|--------|-------------|
| `is(value)` | `true` when `value` matches `current` exactly or by base subtag |
| `includes(value)` | `true` when any tag in `navigator.languages` matches `value` (exact or by base) |
| `set(language)` | Update the current language; recalculates `base` / `region` |
| `reset()` | Re-detect from `navigator.language` / `navigator.languages` (or `fallback`) |

`set()` is a no-op when the value is empty or unchanged, so Alpine bindings do not re-fire needlessly.

## HTML examples

### Reactive content switching

```html
<p x-show="$store.lang.is('es')">Hola mundo</p>
<p x-show="$store.lang.is('en')">Hello world</p>
<p x-show="$store.lang.is('fr')">Bonjour le monde</p>

<button @click="$store.lang.set('es')">Español</button>
<button @click="$store.lang.set('en')">English</button>
<button @click="$store.lang.set('fr')">Français</button>
```

When `set()` is called, every `<p>` whose visibility depends on `$store.lang.is(...)` updates automatically — no reload required.

### Inspect the current language

```html
<dl class="text-sm">
  <dt>current</dt><dd x-text="$store.lang.current"></dd>
  <dt>base</dt><dd x-text="$store.lang.base"></dd>
  <dt>region</dt><dd x-text="$store.lang.region ?? '—'"></dd>
  <dt>languages</dt>
  <dd>
    <template x-for="tag in $store.lang.languages" :key="tag">
      <span x-text="tag"></span>
    </template>
  </dd>
</dl>
```

### Reset to the browser language

```html
<button @click="$store.lang.reset()">Reset to browser language</button>
```

## Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fallback` | `string` | `"en"` | Used when neither `navigator.language` nor `navigator.languages` is available. Normalized when `normalize: true`. |
| `normalize` | `boolean` | `true` | Lower-case the language tag and convert underscores to dashes (`pt_BR` → `pt-br`). |

## Reacting to language changes

`$store.lang` re-renders every binding on change. For side effects — load translations, persist the tag, sync `<html lang>` — wire them through the headless manager's typed `change` event:

```js
import { createLang } from "@ailuracode/alpine-lang";

const lang = createLang({
  fallback: "en",
});

// Multiple subscribers, runtime subscription, returns Unsubscribe.
const stop = lang.on("change", (detail) => {
  // detail: { current, base, region, languages, fallback, isDetected, source, previous }
  // source is "initialization" | "user" | "reset".
  localStorage.setItem("lang", detail.current);
  document.documentElement.lang = detail.current;
  loadMessages(detail.current); // your i18n loader
});

// Bootstrap a saved language without firing a synthetic event (set() emits only on real transitions).
const saved = localStorage.getItem("lang");
if (saved) lang.set(saved);

// later, on teardown
stop();
```

The manager is a singleton per document (matching theme, scroll, etc.). `Alpine.plugin(langPlugin(...))` and `createLang(...)` both reach the same instance, so you can subscribe from any module without coordinating with the Alpine startup sequence.

## Pairing with i18n libraries

Use the plugin as a **single source of truth** for the current language. Hand the value to your i18n layer:

```js
import { createI18n } from "vue-i18n"; // or i18next, etc.
import { createLang } from "@ailuracode/alpine-lang";

const i18n = createI18n({ legacy: false });
const lang = createLang({ fallback: "en" });

lang.on("change", (detail) => {
  i18n.global.locale.value = detail.current;
});
```

The plugin never touches translation tables — it only owns the *current* language tag.

## SSR considerations

- The plugin never throws when `window` / `navigator` are unavailable.
- On the server it uses `fallback` until the client hydrates.
- The store is registered on `Alpine.plugin(...)` and the `change` event is **not** fired until the client hydrates (unless you call `set()` explicitly during SSR).
- For deterministic HTML output during SSR, render only `lang.fallback` / `lang.base` (they are stable across server and client) and let `region` / `languages` populate after hydration.

## Helpers

`normalizeLanguageTag(value)` and `parseLanguageTag(value)` are exported alongside `langPlugin` for advanced use cases (custom adapters, custom stores, etc.).

```ts
import { normalizeLanguageTag, parseLanguageTag } from "@ailuracode/alpine-lang";

normalizeLanguageTag("EN_us"); // "en-us"
parseLanguageTag("es-EC"); // { base: "es", region: "EC" }
```
