---
title: "Lang"
description: "Paquete: @ailuracode/alpine-lang"
---

Package: `@ailuracode/alpine-lang`

Store reactivo del idioma actual para Alpine.js. Detecta el idioma del navegador, expone `current` / `base` / `region` y la lista completa de `navigator.languages`, y permite cambiar el idioma de forma dinámica para que todas las expresiones de Alpine reaccionen en tiempo real.

El plugin **solo administra el idioma actual** — no traduce contenido. Combínalo con cualquier librería de i18n (i18next, diccionarios propios, etc.) y usa el callback `onChange` para cargar los mensajes correspondientes.

## Instalación

```bash
npm install @ailuracode/alpine-lang alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import lang from "@ailuracode/alpine-lang";

Alpine.plugin(lang({
  fallback: "en",    // se usa cuando navigator.language / navigator.languages no están disponibles
  normalize: true,   // minúsculas + convierte "_" en "-"
  onChange(language) {
    // recarga los mensajes de tu i18n, actualiza <html lang>, persiste, …
    document.documentElement.lang = language;
  },
}));

Alpine.start();
```

`onChange` se ejecuta tras cada cambio exitoso de `current` (incluyendo `reset()`).

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
| `set(language)` | Actualiza el idioma actual; recalcula `base` / `region` y dispara `onChange` |
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
| `onChange` | `(language: string) => void` | — | Se llama tras cada `set()` / `reset()` exitoso con la etiqueta completa normalizada. |

## Cambio dinámico de idioma

`$store.lang` es un store reactivo de Alpine. Cualquier expresión de Alpine que lo lea (`x-show`, `x-text`, `:class`, getters calculados, etc.) se vuelve a evaluar al cambiar. El plugin no persiste nada por sí mismo — combínalo con `localStorage`, una cookie o tu backend:

```js
Alpine.plugin(lang({
  fallback: "en",
  onChange(language) {
    localStorage.setItem("lang", language);
    document.documentElement.lang = language;
    loadMessages(language); // tu cargador de i18n
  },
}));

// más tarde, al inicializar, hidrata desde el almacenamiento
const saved = localStorage.getItem("lang");
if (saved) Alpine.store("lang").set(saved);
```

## Integración con librerías de i18n

Usa el plugin como **única fuente de verdad** del idioma actual. Pasa el valor a tu capa de i18n:

```js
import { createI18n } from "vue-i18n"; // o i18next, etc.

const i18n = createI18n({ legacy: false });

Alpine.plugin(lang({
  fallback: "en",
  onChange(language) {
    i18n.global.locale.value = language;
  },
}));
```

El plugin nunca toca las tablas de traducción — solo administra la etiqueta del idioma *actual*.

## Consideraciones SSR

- El plugin no falla cuando `window` o `navigator` no existen.
- En el servidor usa `fallback` hasta que el cliente se hidrate.
- El store se registra en `Alpine.plugin(...)` y `onChange` **no** se llama hasta que el cliente se hidrate (a menos que invoques `set()` manualmente durante SSR).
- Para un HTML determinista durante SSR, renderiza únicamente `lang.fallback` / `lang.base` (son estables entre servidor y cliente) y deja que `region` / `languages` se completen tras la hidratación.

## Helpers

`normalizeLanguageTag(value)` y `parseLanguageTag(value)` se exportan junto al plugin por defecto para casos avanzados (adaptadores personalizados, stores propios, etc.).

```ts
import { normalizeLanguageTag, parseLanguageTag } from "@ailuracode/alpine-lang";

normalizeLanguageTag("EN_us"); // "en-us"
parseLanguageTag("es-EC"); // { base: "es", region: "EC" }
```