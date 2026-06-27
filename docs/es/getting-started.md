---
title: "Primeros pasos"
description: "Instala el toolkit Alpine modular — init lazy, esenciales y TypeScript."
---

## Requisitos

- [Alpine.js](https://alpinejs.dev/) v3+
- Un bundler con soporte ESM (Vite, Webpack, etc.) o módulos ES nativos

## Instalar esenciales

Empieza con el registro core y los cinco módulos esenciales:

```bash
npm install alpinejs \
  @ailuracode/alpinejs-core \
  @ailuracode/alpinejs-theme \
  @ailuracode/alpinejs-screen \
  @ailuracode/alpinejs-scroll \
  @ailuracode/alpinejs-sidebar \
  @ailuracode/alpinejs-toast
```

Añade más paquetes después — cada uno es una dependencia npm independiente.

## Init lazy (recomendado)

Registra plugins en tu entry (`main.js`, `app.ts`, etc.):

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineStorePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpinejs-core";

function applyTheme({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

registerPlugin(
  "theme",
  defineStorePlugin(["theme"], async () => {
    const { default: theme } = await import("@ailuracode/alpinejs-theme");
    return theme({ onChange: applyTheme });
  })
);

registerPlugin(
  "toast",
  lazyPlugin({
    kind: "magic",
    magics: ["toast"],
    import: () => import("@ailuracode/alpinejs-toast"),
  })
);

Alpine.plugin(createAlpinePlugin(["theme", "toast"]));
Alpine.start();
```

Consulta [Core](./core.md) para init sync, tipos de plugin y factories como `theme({ onChange })`.

## Registro directo (apps simples)

Si aún no necesitas lazy loading, registra plugins directamente — siempre **antes** de `Alpine.start()`:

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpinejs-theme";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(screen);

Alpine.start();
```

## Uso en HTML

### Stores

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Oscuro
</button>

<div x-show="$store.device.isMobile">Layout móvil</div>
```

### Magics

```html
<button @click="$toast('Cambios guardados', { variant: 'success' })">Notificar</button>
```

## Niveles de paquetes

| Nivel | Paquetes | Cuándo añadir |
|-------|----------|---------------|
| **Esenciales** | theme, screen, scroll, sidebar, toast | La mayoría de apps Alpine |
| **Extendidos** | network, visibility, clipboard, platform, touch, toggle | Conectividad, portapapeles, hints de dispositivo |
| **Avanzados** | geo, battery, export, share, attention, notify, calendar, json-api | APIs de navegador especializadas |
| **Query** | query + adapter + devtools | Caché de datos en cliente (ver [Query](./query.md)) |

## Siguientes pasos

- [Core](./core.md) — registro lazy e imports dinámicos
- Esenciales — [theme](./plugins/theme.md), [screen](./plugins/screen.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md), [toast](./plugins/toast.md)
- [Playground](/playground/) — demos interactivas
