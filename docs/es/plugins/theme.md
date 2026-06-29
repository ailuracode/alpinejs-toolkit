---
title: "Theme"
description: "Modos claro, oscuro y sistema con $store.theme."
---

Package: `@ailuracode/alpine-theme`

Gestiona la preferencia de tema claro, oscuro y del sistema con persistencia en `localStorage`. Agnóstico al framework CSS — tú controlas cómo se aplica el tema al DOM.

## Instalación

```bash
npm install @ailuracode/alpine-theme alpinejs
```

## Configuración

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

`onChange` se ejecuta al inicializar (antes del primer renderizado si se registra pronto) y cada vez que cambia el tema.

## Store API

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `mode` | `string` | Preferencia del usuario: `light`, `dark` o `system` |
| `resolved` | `string` | Tema aplicado: `light` o `dark` |

### Getters

| Getter | Descripción |
|--------|-------------|
| `isLight` | `mode === 'light'` |
| `isDark` | `mode === 'dark'` |
| `isSystem` | `mode === 'system'` |
| `isResolvedLight` | `resolved === 'light'` |
| `isResolvedDark` | `resolved === 'dark'` |

### Métodos

| Método | Descripción |
|--------|-------------|
| `set(mode)` | Establece la preferencia y persiste en `localStorage` |
| `cycle()` | Rota: light → dark → system → light |
| `refresh()` | Vuelve a resolver `resolved` (p. ej. tras cambio de tema del SO) |
| `is(name)` | Genérico: `is('dark')` |
| `isResolved(name)` | Genérico: `isResolved('light')` |

## Ejemplos HTML

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

## Preferencia del sistema

Cuando `mode` es `system`, el plugin escucha `prefers-color-scheme` y actualiza `resolved` automáticamente. No se requiere configuración adicional.

## `resolved` vs `prefersColorScheme`

Ambos se relacionan con claro/oscuro, pero responden preguntas distintas:

| | `$store.theme.resolved` | `$store.media.prefersColorScheme` |
|---|---|---|
| **Paquete** | `@ailuracode/alpine-theme` | `@ailuracode/alpine-media` |
| **Origen** | Preferencia del usuario (`mode`) + SO cuando `mode === 'system'` | Solo SO, vía `matchMedia` |
| **Mutable** | Sí — `set('dark')` cambia `resolved` | No — señal de entorno de solo lectura |
| **Uso** | Aplicar estilos (`onChange`, clases, `color-scheme`) | Detectar preferencia del SO aunque el usuario la haya anulado |

Pueden diferir. Un usuario puede forzar modo oscuro mientras el SO prefiere claro:

```js
$store.theme.mode               // 'dark'
$store.theme.resolved           // 'dark'
$store.media.prefersColorScheme // 'light' (el SO sigue prefiriendo claro)
```

**Regla práctica:**

- **Estilar la app** → `$store.theme.resolved` (o `isResolvedDark` / `isResolvedLight`)
- **Señal del SO** (analítica, copy condicional, hints de “seguir sistema”) → `$store.media.prefersColorScheme`

Si solo usas `@ailuracode/alpine-theme`, `resolved` basta en la mayoría de apps. Añade `@ailuracode/alpine-media` cuando también necesites breakpoints u otras media features.

```html
<!-- Aplicar tema a la UI -->
<div :class="{ 'dark': $store.theme.isResolvedDark }">...</div>

<!-- Preferencia del SO solo cuando el usuario eligió "system" -->
<p x-show="$store.theme.isSystem">
  Preferencia del sistema: <span x-text="$store.media.prefersColorScheme"></span>
</p>
```

Ver también [Media — tema vs esquema de color del SO](./media.md#theme-vs-media-color-scheme).

## Prevención de FOUC

Registra el plugin y `onChange` lo antes posible en tu archivo de entrada. El plugin se inicializa al registrarse (antes de `Alpine.start()`) para que `onChange` pueda ejecutarse antes del primer renderizado.

Para estilos críticos, añade CSS inline en `<head>` vinculado a tu atributo elegido (p. ej. `[data-theme="dark"]`).

## Tailwind CSS

```js
onChange({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}
```

Habilita el modo oscuro basado en clases en `tailwind.config.js`.
