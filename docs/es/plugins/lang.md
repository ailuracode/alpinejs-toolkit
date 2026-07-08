---
title: "Lang"
description: "Paquete: @ailuracode/alpine-lang"
---

Package: `@ailuracode/alpine-lang`

Store reactivo del idioma actual para Alpine.js. Detecta el idioma del navegador, expone `current` / `base` / `region` y la lista completa de `navigator.languages`, y permite cambiar el idioma de forma dinámica para que todas las expresiones de Alpine reaccionen en tiempo real.

El plugin **solo administra el idioma actual** — no traduce contenido. Combínalo con cualquier librería de i18n (i18next, diccionarios propios, etc.) y reacciona a los cambios a través del evento `change` tipado del manager.

## Instalación

```bash
npm install @ailuracode/alpine-lang alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import { langPlugin, createLang } from "@ailuracode/alpine-lang";

Alpine.plugin(langPlugin({
  fallback: "en",    // se usa cuando navigator.language / navigator.languages no están disponibles
  normalize: true,   // minúsculas + convierte "_" en "-"
}));

Alpine.start();
```

El plugin registra `$store.lang` y el magic `$lang`. Ambos exponen los mismos seis campos reactivos más los cuatro comandos (`is` / `includes` / `set` / `reset`).

## Store API

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `current` | `string` | Etiqueta de idioma completa normalizada (p. ej. `"es-ec"`) |
| `base` | `string` | Subtítulo base del idioma actual (p. ej. `"es"`); coincide con `current` cuando no hay región |
| `region` | `string \| null` | Subtítulo de región (p. ej. `"ec"`); `null` cuando no hay región |
| `languages` | `readonly string[]` | Copia de `navigator.languages`, normalizada |
| `fallback` | `string` | Fallback configurado (normalizado cuando `normalize: true`) |
| `isDetected` | `boolean` | `true` cuando el idioma inicial provino de `navigator` |

### Métodos

| Método | Descripción |
|--------|-------------|
| `is(value)` | `true` cuando `value` coincide exactamente con `current` o con su base |
| `includes(value)` | `true` cuando alguna etiqueta de `navigator.languages` coincide con `value` (exacto o por base) |
| `set(language)` | Actualiza el idioma actual; recalcula `base` / `region` |
| `reset()` | Vuelve a detectar desde `navigator.language` / `navigator.languages` (o `fallback`) |

`set()` es una operación sin efecto cuando el valor está vacío o es igual al actual, por lo que las expresiones de Alpine no se vuelven a evaluar innecesariamente.

## Ejemplos HTML

### Cambio dinámico de contenido

```html
<p x-show="$store.lang.is('es')">Hola mundo</p>
<p x-show="$store.lang.is('en')">Hello world</p>
<p x-show="$store.lang.is('fr')">Bonjour le monde</p>

<button @click="$store.lang.set('es')">Español</button>
<button @click="$store.lang.set('en')">English</button>
<button @click="$store.lang.set('fr')">Français</button>
```

Al llamar a `set()`, todos los `<p>` cuya visibilidad depende de `$store.lang.is(...)` se actualizan automáticamente, sin recargar la página.

### Inspeccionar el idioma actual

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

### Restablecer al idioma del navegador

```html
<button @click="$store.lang.reset()">Restablecer al idioma del navegador</button>
```

## Opciones de configuración

| Opción | Tipo | Por defecto | Descripción |
|--------|------|---------|-------------|
| `fallback` | `string` | `"en"` | Se usa cuando `navigator.language` y `navigator.languages` no están disponibles. Se normaliza cuando `normalize: true`. |
| `normalize` | `boolean` | `true` | Pasa la etiqueta a minúsculas y convierte guiones bajos en guiones (`pt_BR` → `pt-br`). |

## Reaccionar a cambios de idioma

`$store.lang` re-renderiza cada binding al cambiar. Para efectos secundarios — cargar traducciones, persistir la etiqueta, sincronizar `<html lang>` — suscríbete al evento `change` tipado del manager headless:

```js
import { createLang } from "@ailuracode/alpine-lang";

const lang = createLang({
  fallback: "en",
});

// Múltiples suscriptores, suscripción en runtime, devuelve Unsubscribe.
const stop = lang.on("change", (detail) => {
  // detail: { current, base, region, languages, fallback, isDetected, source, previous }
  // source es "initialization" | "user" | "reset".
  localStorage.setItem("lang", detail.current);
  document.documentElement.lang = detail.current;
  loadMessages(detail.current); // tu cargador de i18n
});

// Restaura una etiqueta guardada sin disparar un evento sintético
// (set() solo emite en transiciones reales).
const saved = localStorage.getItem("lang");
if (saved) lang.set(saved);

// más tarde, al desmontar
stop();
```

El manager es un singleton por documento (alineado con theme, scroll, etc.). `Alpine.plugin(langPlugin(...))` y `createLang(...)` apuntan a la misma instancia, por lo que puedes suscribirte desde cualquier módulo sin coordinar con el arranque de Alpine.

## Integración con librerías de i18n

Usa el plugin como **única fuente de verdad** del idioma actual. Pasa el valor a tu capa de i18n:

```js
import { createI18n } from "vue-i18n"; // o i18next, etc.
import { createLang } from "@ailuracode/alpine-lang";

const i18n = createI18n({ legacy: false });
const lang = createLang({ fallback: "en" });

lang.on("change", (detail) => {
  i18n.global.locale.value = detail.current;
});
```

El plugin nunca toca las tablas de traducción — solo administra la etiqueta del idioma *actual*.

## Consideraciones SSR

- El plugin no falla cuando `window` o `navigator` no existen.
- En el servidor usa `fallback` hasta que el cliente se hidrate.
- El store se registra en `Alpine.plugin(...)` y el evento `change` **no** se dispara hasta que el cliente se hidrate (a menos que invoques `set()` manualmente durante SSR).
- Para un HTML determinista durante SSR, renderiza únicamente `lang.fallback` / `lang.base` (son estables entre servidor y cliente) y deja que `region` / `languages` se completen tras la hidratación.

## Helpers

`normalizeLanguageTag(value)` y `parseLanguageTag(value)` se exportan junto a `langPlugin` para casos avanzados (adaptadores personalizados, stores propios, etc.).

```ts
import { normalizeLanguageTag, parseLanguageTag } from "@ailuracode/alpine-lang";

normalizeLanguageTag("EN_us"); // "en-us"
parseLanguageTag("es-EC"); // { base: "es", region: "EC" }
```
