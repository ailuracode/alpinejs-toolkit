---
title: "Theme"
description: "Modos claro, oscuro y sistema con $store.theme."
---

Package: `@ailuracode/alpinejs-theme`

Gestiona la preferencia de tema claro, oscuro y del sistema con persistencia en `localStorage`. Agnóstico al framework CSS — tú controlas cómo se aplica el tema al DOM.

## Instalación

```bash
npm install @ailuracode/alpinejs-theme alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpinejs-theme";

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
