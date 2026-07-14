---
title: "Env"
description: "Magics de entorno del navegador: conectividad, visibilidad, batería y plataforma."
---

Package: `@ailuracode/alpine-env`

Magics de entorno del navegador en un solo paquete: conectividad, visibilidad de pestaña, batería y detección de plataforma.

El entrypoint raíz se centra en los magics de Alpine. La API headless vive en `@ailuracode/alpine-env/controller`.

## Magics

| Magic | Descripción |
|-------|-------------|
| `$network` | Estado online / offline |
| `$visibility` | Visibilidad de pestaña (Page Visibility API) |
| `$battery` | Nivel de batería y carga |
| `$platform` | Detección de SO y dispositivo |

## Instalación

```bash
pnpm add @ailuracode/alpine-env alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import env from "@ailuracode/alpine-env";

Alpine.plugin(env());
Alpine.start();
```

## Registro selectivo

```js
Alpine.plugin(env({ battery: false, visibility: false }));
```

## `$network`

Conectividad reactiva desde `navigator.onLine`.

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `isOnline` | `boolean` | `true` cuando hay conexión |
| `isOffline` | `boolean` | `true` cuando no hay conexión |

```html
<div x-show="$network.isOffline">You are offline</div>
```

## `$visibility`

Visibilidad reactiva de pestaña desde la Page Visibility API.

| Propiedad / método | Tipo | Descripción |
|-------------------|------|-------------|
| `isVisible` | `boolean` | La pestaña es visible |
| `isHidden` | `boolean` | La pestaña está oculta |
| `state` | `"visible" \| "hidden" \| "prerender"` | Estado de visibilidad sin procesar |
| `is(state)` | `(state) => boolean` | Compara el estado actual |

```html
<div x-show="$visibility.isHidden">Tab is in the background</div>
```

`$visibility` se registra mediante [`@ailuracode/alpine-env`](./env.md). Combínalo con [`@ailuracode/alpine-attention`](./attention.md) cuando también necesites wake lock o detección de inactividad.

## `$battery`

Estado reactivo de batería cuando la Battery Status API está disponible.

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `isAvailable` | `boolean` | Battery Status API disponible en este navegador |
| `level` | `number \| null` | Nivel de carga 0–1 |
| `isCharging` | `boolean` | Si el dispositivo está cargando |
| `chargingTime` | `number \| null` | Segundos hasta carga completa (`null` cuando es desconocido) |
| `dischargingTime` | `number \| null` | Segundos hasta descarga (`null` cuando es desconocido) |

```html
<span x-text="`${Math.round(($battery.level ?? 0) * 100)}%`"></span>
```

## `$platform`

Banderas de sistema operativo y dispositivo desde `navigator.userAgent` y señales relacionadas.

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `name` | `PlatformName` | `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`, `"chromeos"` o `"unknown"` |
| `isMac` | `boolean` | macOS |
| `isWindows` | `boolean` | Windows |
| `isLinux` | `boolean` | Linux de escritorio |
| `isIos` | `boolean` | iOS (incluido iPadOS) |
| `isAndroid` | `boolean` | Android |
| `isChromeos` | `boolean` | ChromeOS |
| `is(platform)` | `(platform) => boolean` | Compara contra la plataforma detectada |

```html
<button x-show="$platform.isIos">Install on Home Screen</button>
```

Consulta [Detección de dispositivos](../device-detection.md) para saber cuándo usar `env` frente a `media`.

## Controller headless

Usa el subpath del controller cuando quieras estado de entorno gestionado por ciclo de vida sin Alpine:

```js
import { createEnv } from "@ailuracode/alpine-env/controller";

const env = createEnv();
env.on("change", (detail) => {
  console.log(detail.network.isOnline);
});
```

`EnvController` es seguro para construir en SSR, inicia suscripciones en `mount()` y elimina listeners en `destroy()`.

El paquete raíz ya no exporta helpers de plataforma ni controllers por funcionalidad. Importa el subpath del controller para uso headless y el paquete raíz solo para integración con Alpine.

## Ver también

- [Attention](./attention.md) — wake lock e idle detection
- [Media](./media.md) — consultas de media y esquema de color
- [Detección de dispositivos](../device-detection.md)
