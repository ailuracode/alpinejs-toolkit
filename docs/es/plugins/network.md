---
title: "Network"
description: "Estado de conexión en línea/offline con el magic $network."
---

Package: `@ailuracode/alpinejs-network`

Conectividad de red reactiva mediante el magic `$network`. Envuelve `navigator.onLine` y los eventos `online` / `offline` del navegador.

## Instalación

```bash
npm install @ailuracode/alpinejs-network alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import network from "@ailuracode/alpinejs-network";

Alpine.plugin(network);
Alpine.start();
```

## Magic API

| Propiedad | Tipo | Descripción |
|----------|------|-------------|
| `isOnline` | `boolean` (getter) | `true` cuando el navegador indica conexión online |
| `isOffline` | `boolean` (getter) | `true` cuando el navegador indica conexión offline |

## Ejemplos HTML

```html
<div x-show="!$network.isOnline" class="offline-banner">
  You are offline
</div>

<button :disabled="!$network.isOnline">
  Save (requires connection)
</button>

<span :class="$network.isOnline ? 'dot-online' : 'dot-offline'"></span>
```

## Notas

- Refleja la indicación de conectividad del navegador, no un ping real de red
- La nomenclatura `isOnline` evita la redundancia `$network.online`
- Solo lectura — sin store ni persistencia
