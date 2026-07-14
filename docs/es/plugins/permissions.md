---
title: "Permissions"
description: "Registro de permisos del navegador con adaptadores tipados y el store $store.permissions."
---

Package: `@ailuracode/alpine-permissions`

Registro framework-agnostic de permisos del navegador con un contrato de adaptador tipado.

## Instalación

```bash
pnpm add @ailuracode/alpine-permissions @ailuracode/alpine-core alpinejs
```

Registra solo los adaptadores que necesites desde paquetes de funcionalidad como `@ailuracode/alpine-notify`, `@ailuracode/alpine-geo` y `@ailuracode/alpine-attention`.

## Ejemplo rápido

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

Al registrar el plugin, el registro **consulta** el permiso actual del navegador para cada adaptador e inicia la **observación** de revocaciones. Los prompts nativos nunca se muestran automáticamente.

## Store / magic API

`permissionsPlugin()` registra `$store.permissions` y `$permissions` (el mismo objeto reactivo).

| Miembro | Descripción |
|--------|-------------|
| `registry` | Mapa de solo lectura de nombre de capacidad → `PermissionSnapshot` |
| `get(name)` | Igual que `registry[name]` |
| `query(name)` | Actualiza el permiso desde el navegador (sin prompt) |
| `request(name, options?)` | Solicita permiso cuando `canRequest` es `true` |
| `refresh(name)` | Alias de `query(name)` |
| `watch(name)` | Se suscribe a `PermissionStatus.change` cuando está soportado |
| `register(adapter)` | Registra un adaptador en tiempo de ejecución |

Vincula plantillas a **`$permissions.registry.<name>`** para que Alpine re-renderice cuando cambien los snapshots.

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

## Adaptadores de funcionalidad

| Paquete | Factory | Nombre de permiso |
|---------|---------|-------------------|
| `@ailuracode/alpine-notify` | `createNotificationPermissionAdapter(options?)` | `notifications` |
| `@ailuracode/alpine-geo` | `createGeoPermissionAdapter()` | `geolocation` |
| `@ailuracode/alpine-attention` | `createIdlePermissionAdapter()` | `idle-detection` |

## Política de UX

- Nunca solicites permiso durante el registro del plugin ni el mount del controller.
- `query()` y `watch()` se ejecutan al iniciar el plugin — no muestran prompts.
- Dispara `request()` solo desde acciones explícitas del usuario.
- No vuelvas a solicitar permisos ya reportados como denegados.
- Distingue APIs no soportadas, contextos inseguros, bloqueos de política y restricciones de plataforma.

## Configuración

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

Cuando el plugin se registra, **consulta** cada adaptador por el permiso actual e inicia la **observación** de revocaciones. Esto nunca abre un prompt nativo.

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

`PermissionsController` es framework-agnostic. La integración con Alpine es opcional.

## Relación con plugins de funcionalidad

`$notify`, `$store.geo` y `$idle` conservan sus APIs existentes. Usa `$permissions` cuando necesites un registro único entre capacidades o metadatos de disponibilidad normalizados.

- **Notify** — `createNotificationPermissionAdapter()` envuelve `Notification.permission` y `requestPermission()`.
- **Geo** — `createGeoPermissionAdapter()` usa la Permissions API y la semántica de prompt de geolocalización.
- **Attention** — `createIdlePermissionAdapter()` cubre el permiso de detección de inactividad; `IdleController` usa el mismo adaptador internamente.

## Ver también

- [Notify](./notify.md) — notificaciones del navegador
- [Geo](./geo.md) — geolocalización
- [Attention](./attention.md) — wake lock e idle detection
