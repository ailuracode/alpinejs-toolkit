---
title: "Geo"
description: "Geolocalización y permisos con el store $store.geo."
---

Package: `@ailuracode/alpinejs-geo`

Geolocalización reactiva mediante el store `$store.geo`. Envuelve la [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) del navegador con solicitudes puntuales y seguimiento continuo de posición.

## Instalación

```bash
npm install @ailuracode/alpinejs-geo alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import geo from "@ailuracode/alpinejs-geo";

Alpine.plugin(geo);
Alpine.start();
```

## Store API

### Estado

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `latitude` | `number \| null` | Última latitud conocida en grados decimales |
| `longitude` | `number \| null` | Última longitud conocida en grados decimales |
| `accuracy` | `number \| null` | Radio de precisión en metros |
| `altitude` | `number \| null` | Altitud en metros sobre el elipsoide |
| `altitudeAccuracy` | `number \| null` | Precisión de altitud en metros |
| `heading` | `number \| null` | Dirección de desplazamiento en grados |
| `speed` | `number \| null` | Velocidad en metros por segundo |
| `timestamp` | `number \| null` | Marca de tiempo de posición (Unix ms) |
| `error` | `string \| null` | Último mensaje de error |
| `errorCode` | `number \| null` | Código de error de geolocalización (`1` denegado, `2` no disponible, `3` tiempo de espera agotado) |
| `loading` | `boolean` | `true` mientras una solicitud puntual `request()` está pendiente |
| `watching` | `boolean` | `true` mientras `watch()` está activo |

### Getters

| Getter | Tipo | Descripción |
|--------|------|-------------|
| `hasPosition` | `boolean` | `true` cuando latitud y longitud están disponibles |
| `isSupported` | `boolean` | `true` cuando existe `navigator.geolocation` |
| `isWatching` | `boolean` | Alias de `watching` |
| `isLoading` | `boolean` | Alias de `loading` |
| `hasError` | `boolean` | `true` cuando `error` está definido |

### Acciones

| Método | Devuelve | Descripción |
|--------|---------|-------------|
| `request(options?)` | `Promise<boolean>` | Posición puntual mediante `getCurrentPosition` |
| `watch(options?)` | `boolean` | Inicia `watchPosition`; devuelve `false` si no está soportado o ya se está observando |
| `unwatch()` | `boolean` | Detiene la observación activa; devuelve `false` si no hay ninguna activa |
| `reset()` | `boolean` | Limpia posición y estado de error sin detener una observación |

Todas las acciones aceptan [PositionOptions](https://developer.mozilla.org/en-US/docs/Web/API/PositionOptions) opcionales: `enableHighAccuracy`, `timeout`, `maximumAge`.

## Ejemplos HTML

```html
<button
  @click="$store.geo.request({ enableHighAccuracy: true })"
  :disabled="!$store.geo.isSupported || $store.geo.isLoading"
>
  Use my location
</button>

<p x-show="$store.geo.hasPosition">
  You are at
  <span x-text="$store.geo.latitude.toFixed(4)"></span>,
  <span x-text="$store.geo.longitude.toFixed(4)"></span>
  (±<span x-text="Math.round($store.geo.accuracy)"></span> m)
</p>

<p x-show="$store.geo.hasError" x-text="$store.geo.error"></p>
```

```html
<button
  x-show="!$store.geo.isWatching"
  @click="$store.geo.watch()"
>
  Start tracking
</button>

<button
  x-show="$store.geo.isWatching"
  @click="$store.geo.unwatch()"
>
  Stop tracking
</button>
```

## Notas

- Requiere permiso del usuario en contextos seguros (HTTPS o localhost)
- `request()` y `watch()` comparten el mismo estado reactivo; una actualización exitosa limpia el error anterior
- `reset()` limpia las coordenadas almacenadas pero no detiene una observación activa — llama a `unwatch()` primero si es necesario
- El acceso de solo lectura al entorno no se expone como magic; usa el store para estado compartido y acciones entre componentes
