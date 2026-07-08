---
title: "Primeros pasos"
description: "Instalá el toolkit modular de Alpine — lazy init, esenciales y TypeScript."
---

## Requisitos

- [Alpine.js](https://alpinejs.dev/) v3+
- Un bundler con soporte ESM ([Vite](https://vite.dev/), Webpack, etc.) o ES modules nativos

## Instalación de esenciales

Empezá con el registro core y los cinco módulos esenciales:

```bash
npm install alpinejs \
  @ailuracode/alpine-core \
  @ailuracode/alpine-theme \
  @ailuracode/alpine-media \
  @ailuracode/alpine-scroll \
  @ailuracode/alpine-sidebar \
  @ailuracode/alpine-toast
```

Agregá más paquetes después — cada uno es una dependencia npm independiente.

## Lazy init (recomendado)

Registrá los plugins en la entrada de tu app (`main.js`, `app.ts`, etc.). Solo los plugins que inicialices se cargan por las rutas de import que uses:

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: () => themePlugin(),
  })
);

registerPlugin(
  "toast",
  lazyPlugin(["magic"], {
    names: ["toast"],
    import: () => import("@ailuracode/alpine-toast"),
  })
);

registerPlugin(
  "media",
  lazyPlugin(["store"], {
    names: ["media"],
    import: () => import("@ailuracode/alpine-media"),
  })
);

Alpine.plugin(createAlpinePlugin(["theme", "toast", "media"]));
Alpine.start();
```

## Inicialización lazy

[`@ailuracode/alpine-core`](./core.md) separa **registro** (sin side effects) de **inicialización** (corre los callbacks de Alpine):

```js
import Alpine from "alpinejs";
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "scroll",
  lazyPlugin(["store"], {
    names: ["scroll"],
    import: () => import("@ailuracode/alpine-scroll"),
  })
);

await initPlugins(Alpine, "scroll");
Alpine.start();
```

Usá `createAlpinePlugin()` cuando prefieras el bridge estándar `Alpine.plugin()`. Usá `initPlugins()` directamente en entrypoints async (hidratación SSR, carga por rutas).

Consulta [Core](./core.md) para init sync, tipos de plugin y factories como `themePlugin()`.

## Registro directo (apps simples)

Si todavía no necesitás carga lazy, registrá los plugins directamente — siempre **antes** de `Alpine.start()`:

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";
import { media } from "@ailuracode/alpine-media";

Alpine.plugin(themePlugin());
Alpine.plugin(media);

Alpine.start();
```

Migrá al registro core cuando necesites code-splitting o un único pipeline de init.

Para reaccionar a las transiciones de tema, suscribite a la instancia de `Alpine.store("theme")` y aplicá las clases vos mismo — el paquete es agnóstico al framework CSS a propósito:

```js
Alpine.store("theme").on("change", (detail) => {
  document.documentElement.classList.toggle("dark", detail.resolved === "dark");
});
```

## Uso en HTML

### Stores

```html
<button @click="$store.theme.set('dark')">Oscuro</button>
<button @click="$store.theme.set('light')">Claro</button>
<button @click="$store.theme.set('system')">Sistema</button>
<button @click="$store.theme.toggle()">Alternar</button>

<div x-show="$store.media.matches('mobile')">Layout mobile</div>

<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  Volver arriba
</button>
```

### Magics

```html
<button @click="$toast('Cambios guardados', { variant: 'success' })">Notificar</button>
```

Empujá un payload plano desde eventos o datos server-rendered:

```html
<div
  x-data
  x-init="$toast.fromPayload({ title: 'Guardado', variant: 'success' })"
></div>
```

Consultá [`$toast.fromPayload`](./plugins/toast.md) para ver el shape completo del payload.

## Tiers de paquetes

| Tier | Paquetes | Cuándo agregar |
|------|----------|----------------|
| **Esenciales** | theme, media, scroll, sidebar | La mayoría de las apps Alpine |
| **Headless UI** | dialog, menu, tooltip, toast, tabs, accordion, command, carousel | UI accesible que estilás vos mismo |
| **Extendidos** | network, attention, clipboard, platform, toggle | Conectividad, clipboard, hints de dispositivo |
| **Avanzados** | geo, battery, export, share, attention, notify, calendar, json-api | APIs especializadas del navegador |
| **Query** | query + adapter + devtools | Caché de datos en el cliente (ver [Query](./query.md)) |

## CDN

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import { themePlugin } from "https://esm.sh/@ailuracode/alpine-theme";

  Alpine.plugin(themePlugin());
  Alpine.start();
</script>
```

Para reaccionar a las transiciones de tema desde un snippet CDN:

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import { themePlugin } from "https://esm.sh/@ailuracode/alpine-theme";

  Alpine.plugin(themePlugin());
  Alpine.start();

  // Aplicá clases vía el magic $theme cuando Alpine esté listo
  document.addEventListener("alpine:init", () => {
    Alpine.store("theme").on("change", (detail) => {
      document.documentElement.classList.toggle("dark", detail.resolved === "dark");
    });
  });
</script>
```

## TypeScript

Cada paquete publica `dist/index.d.ts` (imports) y `dist/global.d.ts` (augmentations de Alpine):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-theme" />
/// <reference types="@ailuracode/alpine-toast" />
```

O importá el módulo del plugin — los tipos generados augmentan los globals automáticamente.

## Próximos pasos

- [Core](./core.md) — registro lazy e imports dinámicos
- Esenciales — [theme](./plugins/theme.md), [media](./plugins/media.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md)
- Headless UI — [toast](./plugins/toast.md), [dialog](./plugins/dialog.md), [menu](./plugins/menu.md), [tooltip](./plugins/tooltip.md)
- [Playground](/playground/) — demos interactivos