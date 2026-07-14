---
title: "Permissions"
description: "Registro de permissões do browser com adaptadores tipados via $store.permissions e $permissions."
---

Package: `@ailuracode/alpine-permissions`

Registro de permissões do browser agnóstico de framework com contrato de adaptador tipado.

## Instalação

```bash
pnpm add @ailuracode/alpine-permissions @ailuracode/alpine-core alpinejs
```

Registre apenas os adaptadores necessários a partir de pacotes de feature como [`@ailuracode/alpine-notify`](./notify.md), [`@ailuracode/alpine-geo`](./geo.md) e [`@ailuracode/alpine-attention`](./attention.md).

## Exemplo rápido

```ts
import Alpine from "alpinejs";
import { permissionsPlugin } from "@ailuracode/alpine-permissions";
import { createNotificationPermissionAdapter } from "@ailuracode/alpine-notify";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";
import { createIdlePermissionAdapter } from "@ailuracode/alpine-attention";

Alpine.plugin(
  permissionsPlugin({
    adapters: [
      createNotificationPermissionAdapter(),
      createGeoPermissionAdapter(),
      createIdlePermissionAdapter(),
    ],
  })
);

Alpine.start();
```

```html
<button
  x-show="$permissions.registry.notifications?.canRequest"
  @click="await $permissions.request('notifications')"
>
  Enable notifications
</button>
<p x-text="$permissions.registry.notifications?.permission"></p>
```

Na registro do plugin, o registry **consulta** a permissão atual do browser para cada adaptador e inicia o **monitoramento** de revogações. Prompts nativos nunca são exibidos automaticamente.

## Store / magic API

`permissionsPlugin()` registra `$store.permissions` e `$permissions` (mesmo objeto reativo).

| Membro | Descrição |
|--------|-----------|
| `registry` | Mapa somente leitura de nome da capability → `PermissionSnapshot` |
| `get(name)` | Igual a `registry[name]` |
| `query(name)` | Atualiza permissão do browser (sem prompt) |
| `request(name, options?)` | Solicita permissão quando `canRequest` é `true` |
| `refresh(name)` | Alias para `query(name)` |
| `watch(name)` | Inscreve em `PermissionStatus.change` quando suportado |
| `register(adapter)` | Registra um adaptador em runtime |

Vincule templates a **`$permissions.registry.<name>`** para que o Alpine re-renderize quando os snapshots mudarem.

## Controller API

```ts
import { createPermissions } from "@ailuracode/alpine-permissions";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";

const permissions = createPermissions();
const dispose = permissions.register(createGeoPermissionAdapter());

await permissions.query("geolocation");
await permissions.request("geolocation");
permissions.get("geolocation");

dispose();
permissions.destroy();
```

## Adaptadores de feature

| Pacote | Factory | Nome da permissão |
|--------|---------|-------------------|
| [`@ailuracode/alpine-notify`](./notify.md) | `createNotificationPermissionAdapter(options?)` | `notifications` |
| [`@ailuracode/alpine-geo`](./geo.md) | `createGeoPermissionAdapter()` | `geolocation` |
| [`@ailuracode/alpine-attention`](./attention.md) | `createIdlePermissionAdapter()` | `idle-detection` |

## Política de UX

- Nunca solicite permissão durante o registro do plugin ou mount do controller.
- `query()` e `watch()` rodam na inicialização do plugin — não abrem prompt.
- Dispare `request()` apenas a partir de ações explícitas do usuário.
- Não re-solicite permissões já reportadas como negadas.
- Distinga APIs não suportadas, contextos inseguros, bloqueios de política e restrições de plataforma.

## Configuração

```ts
import Alpine from "alpinejs";
import { permissionsPlugin } from "@ailuracode/alpine-permissions";
import { createNotificationPermissionAdapter } from "@ailuracode/alpine-notify";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";
import { createIdlePermissionAdapter } from "@ailuracode/alpine-attention";

Alpine.plugin(
  permissionsPlugin({
    adapters: [
      createNotificationPermissionAdapter(),
      createGeoPermissionAdapter(),
      createIdlePermissionAdapter(),
    ],
  })
);

Alpine.start();
```

Quando o plugin registra, ele **consulta** cada adaptador pela permissão atual e inicia o **monitoramento** de revogações. Isso nunca abre um prompt nativo.

## Controller headless

```ts
import { createPermissions } from "@ailuracode/alpine-permissions";
import { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";

const permissions = createPermissions();
const dispose = permissions.register(createGeoPermissionAdapter());

await permissions.query("geolocation");
await permissions.request("geolocation");

dispose();
permissions.destroy();
```

`PermissionsController` é agnóstico de framework. A integração com Alpine é opcional.

## Relação com plugins de feature

`$notify`, `$store.geo` e `$idle` mantêm suas APIs existentes. Use `$permissions` quando precisar de um único registry entre capabilities ou metadados normalizados de disponibilidade.

- **Notify** — `createNotificationPermissionAdapter()` encapsula `Notification.permission` e `requestPermission()`.
- **Geo** — `createGeoPermissionAdapter()` usa a Permissions API e semântica de prompt de geolocalização.
- **Attention** — `createIdlePermissionAdapter()` cobre permissão de idle-detection; `IdleController` usa o mesmo adaptador internamente.
