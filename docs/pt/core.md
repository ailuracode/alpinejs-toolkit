---
title: "Core"
description: "Registro lazy de plugins para o toolkit Alpine — init diferido, imports dinâmicos e entrypoints framework-agnostic."
---

`@ailuracode/alpine-core` é o **registro lazy de plugins** no centro do toolkit. Os pacotes individuais continuam instaláveis de forma independente; o core coordena o registro e a inicialização sob demanda — ideal para entradas de app que não deveriam carregar cada plugin na inicialização.

## Por que um core?

Cada pacote `@ailuracode/alpine-*` é um plugin standalone do Alpine.js. O core adiciona:

- **Inicialização diferida** — registra plugins sem executá-los na importação
- **Carga seletiva** — inicializa apenas os plugins que você precisa
- **Imports dinâmicos** — carrega código de plugin sob demanda com `lazyPlugin()`
- **Segurança SSR** — sem globals do navegador no core; os loaders rodam na inicialização

## Registro vs inicialização

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

Para imports dinâmicos:

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

| Tipo | Registra | Exemplo |
|------|----------|---------|
| `magic` | `Alpine.magic()` | `$share`, `$calendar` |
| `store` | `Alpine.store()` | `$store.theme`, `$store.query` |
| `directive` | `Alpine.directive()` | `x-child`, `x-audio`, `x-video` |

Use `definePlugin(kinds, options)` para construir definições com tipagem estrita. Um mesmo plugin pode registrar qualquer combinação dos três passando uma lista de kinds; quando você declara mais de um kind, `names` vira um objeto indexado por kind:

```ts
definePlugin(["magic", "store"], {
  names: { magic: ["wakelock"], store: ["idle"] },
  plugin: cb,
});
```

Passe `{ allowNameCrossKind: true }` para permitir o mesmo nome sob vários kinds do mesmo plugin.

## Plugins factory

Plugins como `theme` e `query` são factories que retornam um callback do Alpine. Resolva a factory **antes** de registrar:

```ts
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], { names: ["theme"], plugin: () => themePlugin() })
);
```

O core não gerencia opções do plugin — apenas quando o callback resolvido é executado.

## Tree shaking

O core não importa pacotes de plugins. Você importa apenas os plugins que usa e os registra explicitamente. Pacotes não usados nunca entram no bundle.

## TypeScript

Referencie os tipos do core na sua app:

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-core/global" />
```

O subpath `./global` re-exporta a superfície de `@types/alpinejs` para que consumidores que augmentam `Alpine.*` não precisem adicionar um segundo triple-slash. Por convenção do toolkit, este pacote NÃO augmenta módulos externos — os consumidores tipam o runtime com o genérico `Alpine<Stores>` de `@ailuracode/alpine-core` diretamente.

## Resumo da API

| Função | Propósito |
|--------|-----------|
| `registerPlugin(name, definition)` | Adiciona um plugin ao registro |
| `unregisterPlugin(name)` | Remove um plugin do registro |
| `initPlugins(Alpine, names?)` | Inicializa plugins (suporta loaders async) |
| `initPluginsSync(Alpine, names?)` | Inicializa apenas plugins sync |
| `createAlpinePlugin(names?)` | Bridge para `Alpine.plugin()` |
| `definePlugin(kinds, options)` | Constrói uma definição de plugin tipada |
| `lazyPlugin(kinds, options)` | Constrói uma definição com import dinâmico |
| `isPluginInitialized(name)` | Verifica o estado de inicialização |
| `markPluginInitialized(name)` | Marca um plugin como inicializado |
| `getRegisteredPlugins()` | Inspeciona o registro |
| `getRegisteredPlugin(name)` | Busca um plugin |
| `resolvePluginEntries(names?)` | Resolve nomes para entradas do registro |
| `resetPluginRegistry()` | Limpa o registro (tests / storybook) |
| `setRegistryDebugSink(sink)` | Envia eventos do registro a um `DebugLogger` |
| `getRegistryDebugSink()` | Recupera o sink de debug configurado |

## Primitivas de controller

| Export | Propósito |
|--------|-----------|
| `BaseController<EventMap>` | Base abstrata para cada controller headless |
| `EventEmitter<EventMap>` | Bus fortemente tipado com `on` / `once` / `off` / `emit` |
| `CleanupStack` | Pilha LIFO de callbacks de cleanup com `dispose()` idempotente |
| `InstanceRegistry<T>` | Mapa de instâncias de controller indexado por ID de string |
| `ToolkitError` | Erro base com `code` estável e `cause` opcional |
| `Alpine<Stores>` | Visão tipada de `Alpine` cujos overloads de `store()` se ajustam a `Stores` |
| `PluginCallback<T>` | Callback genérico de `Alpine.plugin()` tipado contra uma visão de `Alpine` |