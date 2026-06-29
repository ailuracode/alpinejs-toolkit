---
title: "Core"
description: "@ailuracode/alpine-core es el registro lazy de plugins del monorepo. Los paquetes individuales siguen siendo instalables de forma independiente; el core coor…"
---

`@ailuracode/alpine-core` es el registro lazy de plugins del monorepo. Los paquetes individuales siguen siendo instalables de forma independiente; el core coordina el registro y la inicialización bajo demanda.

## ¿Por qué un core?

Cada paquete `@ailuracode/alpine-*` es un plugin standalone de Alpine.js. El core añade:

- **Inicialización diferida** — registra plugins sin ejecutarlos al importar
- **Carga selectiva** — inicializa solo los plugins que necesitas
- **Importaciones dinámicas** — carga código del plugin bajo demanda con `lazyPlugin()`
- **Seguridad SSR** — sin globals del navegador en el core; los loaders se ejecutan al inicializar

## Registro vs inicialización

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineMagicPlugin,
  defineStorePlugin,
  initPlugins,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { sharePlugin } from "@ailuracode/alpine-transfer";
import theme from "@ailuracode/alpine-theme";

// Register (no side effects)
registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));
registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({ onChange: applyTheme }))
);

// Initialize before Alpine.start()
Alpine.plugin(createAlpinePlugin(["share", "theme"]));
Alpine.start();
```

Para importaciones dinámicas:

```js
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "share",
  lazyPlugin({
    kind: "magic",
    magics: ["share"],
    import: () => import("@ailuracode/alpine-transfer"),
  })
);

await initPlugins(Alpine, "share");
Alpine.start();
```

## Plugin kinds

| Tipo | Registra | Ejemplo |
|------|-----------|---------|
| `magic` | `Alpine.magic()` | `$share`, `$calendar` |
| `store` | `Alpine.store()` | `$store.theme`, `$store.query` |
| `both` | magics y/o stores | `$wakelock`, `$idle` |

Usa `defineMagicPlugin`, `defineStorePlugin` o `defineHybridPlugin` para construir definiciones con tipado estricto.

## Factory plugins

Plugins como `theme` y `query` son factories que devuelven un callback de Alpine. Resuelve la factory **antes** de registrar:

```js
registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({ onChange: applyTheme }))
);
```

El core no gestiona opciones del plugin — solo cuándo se ejecuta el callback resuelto.

## Tree shaking

El core no importa paquetes de plugins. Importas solo los plugins que usas y los registras explícitamente. Los paquetes no usados nunca entran en el bundle.

## TypeScript

Referencia los tipos del core en tu app:

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
```

Sigue referenciando los `global.d.ts` individuales de cada plugin para ampliaciones de `$store.*` y `$magic`.

## Resumen de API

| Función | Propósito |
|----------|---------|
| `registerPlugin(name, definition)` | Añade un plugin al registro |
| `initPlugins(Alpine, names?)` | Inicializa plugins (soporta loaders async) |
| `initPluginsSync(Alpine, names?)` | Inicializa solo plugins sync |
| `createAlpinePlugin(names?)` | Puente hacia `Alpine.plugin()` |
| `lazyPlugin(options)` | Construye una definición con import dinámico |
| `isPluginInitialized(name)` | Comprueba el estado de init |
| `getRegisteredPlugins()` | Inspecciona el registro |
