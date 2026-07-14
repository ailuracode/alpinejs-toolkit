---
title: Composição de permissões
description: Componha o registro de permissões com adapters de notify, geo e attention.
---

A família Permissions combina um registro base com pacotes de capacidade opcionais. Cada capacidade mantém seu próprio pacote npm e API, enquanto adapters permitem coordenar o estado de permissão via `$permissions`.

## Quando usar o quê

| Necessidade | Pacote | Superfície |
|-------------|--------|------------|
| Registro unificado entre capacidades | `@ailuracode/alpine-permissions` | `$permissions` / `$store.permissions` |
| Notificações do browser | `@ailuracode/alpine-notify` | `$notify` |
| Geolocalização | `@ailuracode/alpine-geo` | `$store.geo` |
| Wake lock e detecção de idle | `@ailuracode/alpine-attention` | `$wakelock`, `$idle` |

Use a API da feature diretamente quando precisar de apenas uma capacidade. Registre o adapter correspondente quando quiser snapshots normalizados de permissão, metadados de disponibilidade e um registro único em templates.

## Configuração recomendada

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
```

Registre apenas os adapters que precisar. O registro consulta a permissão atual na inicialização e observa revogações — nunca abre prompts nativos automaticamente.

## Regras de UX

1. Chame `request()` apenas a partir de ações explícitas do usuário.
2. Explique por que a permissão é necessária antes de solicitar.
3. Trate estados não suportados, contexto inseguro, negado e restrito pela plataforma como ramos normais de UI.
4. Vincule templates a `$permissions.registry.<name>` para snapshots reativos.

## Demos relacionadas

- [Playground da família Permissions](/playground/browser-capabilities/permissions/)
- [Pacote Permissions](/plugins/permissions/)
- [Notify](/plugins/notify/) · [Geo](/plugins/geo/) · [Attention](/plugins/attention/)
