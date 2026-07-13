---
title: "Theme"
description: "Modos claro, oscuro y sistema con $store.theme."
---

Package: `@ailuracode/alpine-theme`

Gestiona la preferencia de tema claro, oscuro y del sistema con persistencia en `localStorage`, sincronización entre pestañas y estrategia de DOM enchufable. El estado se divide en tres campos ortogonales — `current` (elección del usuario), `system` (preferencia del SO) y `resolved` (valor efectivo) — y se expone reactivamente vía `$store.theme` y la magia `$theme`.

## Instalación

```bash
npm install @ailuracode/alpine-theme @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Modelo de estado

Tres observables independientes en `$store.theme`:

| Campo      | Significado                                  | Valores                          |
| ---------- | -------------------------------------------- | -------------------------------- |
| `current`  | La selección del usuario                      | `'light' \| 'dark' \| 'system'`  |
| `system`   | Preferencia del SO, actualizada vía `matchMedia` | `'light' \| 'dark'`              |
| `resolved` | Tema efectivo aplicado a la página           | `'light' \| 'dark'`              |

Ejemplos:

- Usuario eligió `system`, SO oscuro → `current='system'`, `system='dark'`, `resolved='dark'`.
- Usuario eligió `light`, SO oscuro → `current='light'`, `system='dark'`, `resolved='light'`.
- Usuario eligió `dark`, SO claro → `current='dark'`, `system='light'`, `resolved='dark'`.

`resolved` se actualiza automáticamente cuando cambia el SO **solo** si `current === 'system'`. Una elección explícita (`light` / `dark`) congela `resolved` ante los cambios del SO.

## Configuración

El plugin aplica el tema a `<html>` por defecto. Elige una de las dos estrategias integradas.

### Estrategia class (predeterminada — Tailwind, shadcn)

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";

Alpine.plugin(themePlugin({
  strategy: "class",      // predeterminado
  darkClass: "dark",
  lightClass: "light",
  defaultTheme: "system", // opcional, predeterminado: "system"
  storageKey: "theme",    // opcional, predeterminado: "theme"
}));

Alpine.start();
```

```html
<html class="dark"></html>
```

### Estrategia attribute

```js
Alpine.plugin(themePlugin({ strategy: "attribute", attribute: "data-theme" }));
```

```html
<html data-theme="dark"></html>
```

El plugin arranca al registrarse (antes de `Alpine.start()`), por lo que el tema resuelto está en el DOM antes del primer paint.

## API del store

### Estado (lectura directa — sin getters)

```html
<p>Elección:   <span x-text="$store.theme.current"></span></p>
<p>SO:         <span x-text="$store.theme.system"></span></p>
<p>Aplicado:   <span x-text="$store.theme.resolved"></span></p>

<button :class="{ active: $store.theme.current === 'light' }" @click="$store.theme.set('light')">Light</button>
<button :class="{ active: $store.theme.current === 'dark' }" @click="$store.theme.set('dark')">Dark</button>
<button :class="{ active: $store.theme.current === 'system' }" @click="$store.theme.set('system')">System</button>
```

Las comparaciones directas se leen mejor que un getter por valor y mantienen la superficie del store mínima.

### Métodos

| Método             | Descripción                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `set(value)`       | Define una nueva preferencia (`'light' \| 'dark' \| 'system'`). Persiste, recalcula y aplica.                                 |
| `toggle()`         | Alterna entre `light` y `dark` según el tema resuelto. **Crea una preferencia explícita** — NO vuelve a `'system'`.            |
| `reset()`          | Restablece al predeterminado configurado y elimina el valor persistido.                                                        |
| `apply()`          | Vuelve a aplicar el tema resuelto actual al DOM, evitando la caché de la estrategia. Útil tras mutaciones externas de `<html>` (view transitions de Astro, extensiones del navegador, hot reload). |

### Eventos de cambio

Suscríbete al evento `change` del manager — útil para analítica, espejado en servidor o UI fuera de Alpine:

```js
import { themePlugin, createTheme } from "@ailuracode/alpine-theme";

const manager = createTheme({ strategy: "class" });
manager.on("change", (detail) => {
  // detail: { current, system, resolved, source, previous }
  // source: "initialization" | "user" | "system" | "storage" | "reset"
  console.log(detail.source, detail.previous?.resolved, "→", detail.resolved);
});
```

Dentro de un x-data de Alpine, lee `$store.theme` reactivamente — Alpine hace la suscripción por ti.

## `resolved` vs `prefersColorScheme`

Ambos se relacionan con claro/oscuro pero responden preguntas distintas:

|                                | `$store.theme.resolved`              | `$store.media.prefersColorScheme` |
| ------------------------------ | ------------------------------------ | --------------------------------- |
| **Paquete**                    | `@ailuracode/alpine-theme`           | `@ailuracode/alpine-media`        |
| **Origen**                     | Preferencia del usuario + SO cuando `current === 'system'` | Solo SO, vía `matchMedia`         |
| **Mutable**                    | Sí — `set('dark')` la cambia         | No — señal de entorno de solo lectura |
| **Uso**                        | Aplicar estilos (clases, `color-scheme`) | Detectar preferencia del SO incluso con override del usuario |

Pueden divergir — un usuario puede forzar oscuro mientras el SO prefiere claro:

```js
$store.theme.current            // 'dark'
$store.theme.resolved           // 'dark'
$store.media.prefersColorScheme // 'light' (el SO aún prefiere claro)
```

**Regla práctica:**

- **Estilizar la app** → `$store.theme.resolved`
- **Señal del SO** (analítica, copy condicional, pistas de "sigue al sistema") → `$store.media.prefersColorScheme`

Si solo usas `@ailuracode/alpine-theme`, `resolved` basta para la mayoría de apps. Añade `@ailuracode/alpine-media` cuando también necesites breakpoints u otras media features.

```html
<!-- Aplicar el tema -->
<div :class="{ 'dark': $store.theme.resolved === 'dark' }">…</div>

<!-- Mostrar preferencia del SO solo cuando el usuario eligió "system" -->
<p x-show="$store.theme.current === 'system'">
  Preferencia del sistema: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

Ver también [Media — tema vs esquema de color del SO](./media.md#theme-vs-media-color-scheme).

## Prevención de FOUC

Para páginas sin renderizado en servidor, añade un snippet inline en `<head>` que lea `localStorage` y aplique la clase / atributo **antes** de que Alpine cargue:

```html
<head>
  <script>
    // Ajusta `key` / `className` a tu configuración.
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

En apps gestionadas por Alpine el plugin ya hace esto al registrarse, pero el snippet inline sigue siendo la única forma de evitar un flash en conexiones lentas.

## Tailwind CSS

La estrategia `class` por defecto ya está lista para Tailwind:

```js
Alpine.plugin(themePlugin({ strategy: "class", darkClass: "dark" }));
```

Asegúrate de tener dark mode basado en clase en tu `tailwind.config`:

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

## Migración desde `@ailuracode/alpine-theme@0.x`

| `0.x`                                                                       | `1.x`                                                                                       |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Campo único `mode`                                                          | Tres campos independientes: `current` / `system` / `resolved`                              |
| Getters `isLight` / `isDark` / `isSystem` / `isResolvedLight` / `isResolvedDark` | Eliminados — lee `$store.theme.current` / `.resolved` directamente y compara               |
| `set(mode)` / `cycle()` / `refresh()`                                       | `set(value)` / `toggle()` / `reset()`. `cycle()` y `refresh()` desaparecen.                |
| Callback `onChange` en `themePlugin(options)`                               | `manager.on('change', listener)`. Suscríbete tras `createTheme()` si necesitas el callback. |
| Un único adaptador `localStorage`                                           | `ThemeStorage` enchufable — pasa `createLocalStorageThemeStorage({ key })` para mantener los defaults. |
