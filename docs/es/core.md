---
title: "Core"
description: "Registro lazy de plugins para el toolkit Alpine — init diferido, imports dinámicos y entrypoints framework-agnostic."
---

`@ailuracode/alpine-core` es el **registro lazy de plugins** en el centro del toolkit. Los paquetes individuales siguen siendo instalables de forma independiente; el core coordina el registro y la inicialización bajo demanda — ideal para entradas de app que no deberían cargar cada plugin al inicio.

## ¿Por qué un core?

Cada paquete `@ailuracode/alpine-*` es un plugin standalone de Alpine.js. El core añade:

- **Inicialización diferida** — registra plugins sin ejecutarlos al importar
- **Carga selectiva** — inicializa solo los plugins que necesitás
- **Imports dinámicos** — carga código de plugin bajo demanda con `lazyPlugin()`
- **Seguridad SSR** — sin globals del navegador en el core; los loaders se ejecutan al inicializar

## Registro vs inicialización

```ts
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  initPlugins,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], { names: ["theme"], plugin: () => themePlugin() })
);

// Inicializa antes de Alpine.start()
Alpine.plugin(createAlpinePlugin(["theme"]));
Alpine.start();
```

Para imports dinámicos:

```ts
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "share",
  lazyPlugin(["magic"], {
    names: ["share"],
    import: () => import("@ailuracode/alpine-transfer"),
  })
);

await initPlugins(Alpine, "share");
Alpine.start();
```

## Tipos de plugin

| Tipo | Registra | Ejemplo |
|------|----------|---------|
| `magic` | `Alpine.magic()` | `$share`, `$calendar` |
| `store` | `Alpine.store()` | `$store.theme`, `$store.query` |
| `directive` | `Alpine.directive()` | `x-child`, `x-audio`, `x-video` |

Usá `definePlugin(kinds, options)` para construir definiciones con tipado estricto. Un mismo plugin puede registrar cualquier combinación de los tres pasando una lista de kinds; cuando declarás más de un kind, `names` se convierte en un objeto indexado por kind:

```ts
definePlugin(["magic", "store"], {
  names: { magic: ["wakelock"], store: ["idle"] },
  plugin: cb,
});
```

Pasá `{ allowNameCrossKind: true }` para permitir el mismo nombre bajo varios kinds del mismo plugin.

## Plugins factory

Plugins como `theme` y `query` son factories que devuelven un callback de Alpine. Resolvé la factory **antes** de registrar:

```ts
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], { names: ["theme"], plugin: () => themePlugin() })
);
```

El core no gestiona opciones del plugin — solo cuándo se ejecuta el callback resuelto.

## Tree shaking

El core no importa paquetes de plugins. Importás solo los plugins que usás y los registrás explícitamente. Los paquetes no usados nunca entran en el bundle.

## TypeScript

Referenciá los tipos del core en tu app:

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-core/global" />
```

El subpath `./global` re-exporta la superficie de `@types/alpinejs` para que los consumidores que augumentan `Alpine.*` no necesiten agregar un segundo triple-slash. Por convención del toolkit, este paquete NO augmenta módulos externos — los consumidores tipan el runtime con el genérico `Alpine<Stores>` de `@ailuracode/alpine-core` directamente.

## Resumen de API

| Función | Propósito |
|---------|-----------|
| `registerPlugin(name, definition)` | Agrega un plugin al registro |
| `unregisterPlugin(name)` | Remueve un plugin del registro |
| `initPlugins(Alpine, names?)` | Inicializa plugins (soporta loaders async) |
| `initPluginsSync(Alpine, names?)` | Inicializa solo plugins sync |
| `createAlpinePlugin(names?)` | Bridge hacia `Alpine.plugin()` |
| `definePlugin(kinds, options)` | Construye una definición de plugin tipada |
| `lazyPlugin(kinds, options)` | Construye una definición con import dinámico |
| `isPluginInitialized(name)` | Verifica el estado de inicialización |
| `markPluginInitialized(name)` | Marca un plugin como inicializado |
| `getRegisteredPlugins()` | Inspecciona el registro |
| `getRegisteredPlugin(name)` | Busca un plugin |
| `resolvePluginEntries(names?)` | Resuelve nombres a entradas del registro |
| `resetPluginRegistry()` | Limpia el registro (tests / storybook) |
| `setRegistryDebugSink(sink)` | Envía eventos del registro a un `DebugLogger` |
| `getRegistryDebugSink()` | Recupera el sink de debug configurado |

## Primitivas de controller

| Export | Propósito |
|--------|-----------|
| `BaseController<EventMap>` | Base abstracta para cada controller headless |
| `EventEmitter<EventMap>` | Bus fuertemente tipado con `on` / `once` / `off` / `emit` |
| `CleanupStack` | Stack LIFO de callbacks de cleanup con `dispose()` idempotente |
| `InstanceRegistry<T>` | Mapa de instancias de controller indexado por ID de string |
| `ToolkitError` | Error base con `code` estable y `cause` opcional |
| `Alpine<Stores>` | Vista tipada de `Alpine` cuyos overloads de `store()` se ajustan a `Stores` |
| `PluginCallback<T>` | Callback genérico de `Alpine.plugin()` tipado contra una vista de `Alpine` |