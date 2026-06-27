---
title: "Attention"
description: "Wake Lock e Idle Detection con los magics $wakelock y $idle."
---

Package: `@ailuracode/alpinejs-attention`

Screen Wake Lock e Idle Detection reactivos mediante los magics `$wakelock` y `$idle`. Envuelve la [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) y la [Idle Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Idle_Detection_API) cuando están disponibles.

## Instalación

```bash
npm install @ailuracode/alpinejs-attention alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import attention from "@ailuracode/alpinejs-attention";

Alpine.plugin(attention);
Alpine.start();
```

## `$wakelock` magic

| Propiedad / método | Tipo | Descripción |
|-----------------|------|-------------|
| `isSupported` | `boolean` | `true` cuando `navigator.wakeLock` está disponible |
| `isActive` | `boolean` | `true` mientras se mantiene un wake lock de pantalla |
| `isRequesting` | `boolean` | `true` mientras `request()` está en curso |
| `error` | `string \| null` | Último mensaje de error, si lo hay |
| `request()` | `() => Promise<boolean>` | Adquiere un wake lock de pantalla |
| `release()` | `() => Promise<boolean>` | Libera el wake lock actual |

El plugin vuelve a adquirir el wake lock cuando la pestaña vuelve a ser visible si previamente llamaste a `request()` y no has llamado a `release()`.

## `$idle` magic

| Propiedad / método | Tipo | Descripción |
|-----------------|------|-------------|
| `isSupported` | `boolean` | `true` cuando `IdleDetector` está disponible |
| `isWatching` | `boolean` | `true` mientras la detección de inactividad está activa |
| `isLoading` | `boolean` | `true` mientras `start()` está en curso |
| `isActive` | `boolean` | `true` cuando el usuario está activo |
| `isIdle` | `boolean` | `true` cuando el usuario está inactivo |
| `userState` | `'active' \| 'idle' \| null` | Estado de inactividad actual del usuario |
| `screenState` | `'locked' \| 'unlocked' \| null` | Estado de bloqueo de pantalla actual |
| `permission` | `PermissionState \| null` | Último permiso conocido de detección de inactividad |
| `threshold` | `number` | Umbral de inactividad en milisegundos (predeterminado y mínimo `60000`) |
| `error` | `string \| null` | Último mensaje de error, si lo hay |
| `requestPermission()` | `() => Promise<PermissionState>` | Solicita permiso de detección de inactividad |
| `start(options?)` | `(options?: { threshold?: number }) => Promise<boolean>` | Inicia la detección de inactividad |
| `stop()` | `() => boolean` | Detiene la detección de inactividad |

## Ejemplos HTML

```html
<section x-data>
  <p x-show="!$wakelock.isSupported">Wake Lock is not supported here.</p>
  <button
    type="button"
    x-show="$wakelock.isSupported"
    @click="$wakelock.isActive ? $wakelock.release() : $wakelock.request()"
    x-text="$wakelock.isActive ? 'Allow sleep' : 'Keep screen awake'"
  ></button>
</section>

<section x-data>
  <p x-show="!$idle.isSupported">Idle Detection is not supported here.</p>
  <button
    type="button"
    x-show="$idle.isSupported && !$idle.isWatching"
    @click="$idle.start()"
  >
    Start idle detection
  </button>
  <p x-show="$idle.isWatching">
    User: <strong x-text="$idle.userState"></strong> ·
    Screen: <strong x-text="$idle.screenState"></strong>
  </p>
  <p x-show="$idle.isIdle" class="hint">User went idle — pause expensive work.</p>
</section>
```

## Notas

- Ambas APIs requieren un [contexto seguro](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) (HTTPS o localhost)
- Idle Detection requiere permiso explícito mediante `requestPermission()` o `start()`
- El umbral de inactividad debe ser de al menos **1 minuto** (`60000` ms); los valores inferiores se ajustan automáticamente
- Los wake locks se liberan automáticamente cuando la pestaña se oculta; el plugin los vuelve a solicitar al regresar cuando corresponde
- El soporte del navegador es limitado — comprueba siempre `isSupported` antes de llamar a las acciones
- Estado de entorno de solo lectura con métodos imperativos — sin store ni persistencia
