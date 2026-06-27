---
title: "Platform"
description: "Detección de SO, navegador y dispositivo con $platform."
---

Package: `@ailuracode/alpinejs-platform`

Detecta el sistema operativo y la plataforma del cliente mediante el magic `$platform`.

## Instalación

```bash
npm install @ailuracode/alpinejs-platform alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import platform from "@ailuracode/alpinejs-platform";

Alpine.plugin(platform);
Alpine.start();
```

## Magic API

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `name` | `PlatformName` (getter) | Plataforma resuelta |
| `isMac` | `boolean` (getter) | macOS de escritorio |
| `isWindows` | `boolean` (getter) | Windows |
| `isLinux` | `boolean` (getter) | Linux de escritorio |
| `isIos` | `boolean` (getter) | iOS / iPadOS |
| `isAndroid` | `boolean` (getter) | Android |
| `isChromeos` | `boolean` (getter) | ChromeOS |
| `is(platform)` | `boolean` | `true` cuando `name` coincide con la plataforma dada |

## Ejemplos HTML

```html
<p x-show="$platform.isMac">Use ⌘ shortcuts</p>
<p x-show="$platform.isWindows">Use Ctrl shortcuts</p>
<p x-show="$platform.isIos">iOS-specific instructions</p>

<p>Platform: <span x-text="$platform.name"></span></p>
```

## Helpers exportados

Las funciones de detección puras se exportan para reutilizar en otros paquetes:

```js
import {
  PLATFORM_NAMES,
  createPlatformState,
  detectPlatformName,
  isAndroidDevice,
  isIosDevice,
  isLinuxDevice,
  isMacDevice,
  isWindowsDevice,
  platformFlags,
  readPlatformState,
} from "@ailuracode/alpinejs-platform";
```

`@ailuracode/alpinejs-notify` usa `isIosDevice()` e `isAndroidDevice()` internamente para la entrega de notificaciones móviles.

## Estrategia de detección

1. `navigator.userAgentData.platform` (Client Hints) cuando está disponible
2. `navigator.userAgent` y `navigator.platform`
3. Modo escritorio de iPadOS mediante `MacIntel` + `maxTouchPoints > 1`

## Casos de uso

- Mostrar atajos de teclado específicos del SO
- Ramificar instrucciones de instalación o permisos (p. ej. pantalla de inicio en iOS)
- Complementar `@ailuracode/alpinejs-screen` (viewport) y `@ailuracode/alpinejs-touch` (puntero)

## Notas

- Magic de solo lectura — sin store
- Agnóstico al framework CSS
- La plataforma se resuelve una vez al cargar el plugin (estática durante la sesión)
