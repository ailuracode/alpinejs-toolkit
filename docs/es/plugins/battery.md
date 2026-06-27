---
title: "Battery"
description: "Estado de la batería del dispositivo con el magic $battery."
---

Package: `@ailuracode/alpinejs-battery`

Estado de batería reactivo mediante el magic `$battery`. Envuelve la [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API) cuando `navigator.getBattery()` está disponible.

## Instalación

```bash
npm install @ailuracode/alpinejs-battery alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import battery from "@ailuracode/alpinejs-battery";

Alpine.plugin(battery);
Alpine.start();
```

## Magic API

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `isAvailable` | `boolean` | `true` cuando los datos de batería están soportados y cargados |
| `level` | `number \| null` | Nivel de carga de `0` a `1`, o `null` cuando no está disponible |
| `isCharging` | `boolean` | `true` cuando el dispositivo se está cargando |
| `chargingTime` | `number \| null` | Segundos hasta carga completa, o `null` cuando es desconocido |
| `dischargingTime` | `number \| null` | Segundos hasta descarga completa, o `null` cuando es desconocido |

## Ejemplos HTML

```html
<div x-show="$battery.isAvailable" class="battery-widget">
  <span x-text="Math.round($battery.level * 100) + '%'"></span>
  <span x-show="$battery.isCharging">Charging</span>
</div>

<div x-show="!$battery.isAvailable">
  Battery status not available on this device
</div>

<div
  x-show="$battery.isAvailable && $battery.level < 0.2 && !$battery.isCharging"
  class="low-battery-warning"
>
  Low battery
</div>
```

## Notas

- El soporte del navegador es limitado — muchos navegadores de escritorio no exponen datos de batería
- Usa `isAvailable` antes de leer `level` o el estado de carga
- `level` es una fracción (`0.5` = 50%); multiplica por `100` para obtener un porcentaje en las plantillas
- `chargingTime` y `dischargingTime` son `null` cuando la API reporta `Infinity`
- Solo lectura — sin store ni persistencia
