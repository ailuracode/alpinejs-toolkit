---
title: Composición de permisos
description: Componer el registro de permisos con los adaptadores de notify, geo y attention.
---

La familia Permissions combina un registro base con paquetes de capacidades opcionales. Cada capacidad mantiene su propio paquete npm y API, mientras que los adaptadores permiten coordinar el estado de permisos mediante `$permissions`.

## Cuándo usar qué

| Necesidad | Paquete | Superficie |
|-----------|---------|------------|
| Registro unificado entre capacidades | `@ailuracode/alpine-permissions` | `$permissions` / `$store.permissions` |
| Notificaciones del navegador | `@ailuracode/alpine-notify` | `$notify` |
| Geolocalización | `@ailuracode/alpine-geo` | `$store.geo` |
| Wake lock e idle detection | `@ailuracode/alpine-attention` | `$wakelock`, `$idle` |

Usa la API de cada capacidad directamente cuando solo necesites una. Registra el adaptador correspondiente cuando quieras snapshots normalizados, metadatos de disponibilidad y un único registro en plantillas.

## Configuración recomendada

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

Registra solo los adaptadores que necesites. El registro consulta el permiso actual al iniciar y observa revocaciones — nunca abre prompts nativos automáticamente.

## Reglas de UX

1. Llama a `request()` solo desde acciones explícitas del usuario.
2. Explica por qué se necesita el permiso antes de solicitarlo.
3. Trata estados no soportados, contexto inseguro, denegado y restricciones de plataforma como ramas normales de la UI.
4. Enlaza plantillas a `$permissions.registry.<name>` para snapshots reactivos.

## Demos relacionados

- [Playground de la familia Permissions](/playground/browser-capabilities/permissions/)
- [Paquete Permissions](/plugins/permissions/)
- [Notify](/plugins/notify/) · [Geo](/plugins/geo/) · [Attention](/plugins/attention/)
