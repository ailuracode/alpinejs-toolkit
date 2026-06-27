---
title: "Toggle"
description: "Alternar valores booleanos con el magic $toggle."
---

Package: `@ailuracode/alpinejs-toggle`

Magic invocable `$toggle()` para máquinas de estado **binarias** y **ternarias** con unions TypeScript inferidas.

## Instalación

```bash
npm install @ailuracode/alpinejs-toggle alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import toggle from "@ailuracode/alpinejs-toggle";

Alpine.plugin(toggle);
Alpine.start();
```

## Magic API

`$toggle(options)` devuelve una instancia reactiva por llamada (como `$calendar()`).

### Opciones

| Opción | Tipo | Descripción |
|--------|------|-------------|
| `states.truly` | `A` | Primer estado opuesto (requerido) |
| `states.falsely` | `B` | Segundo estado opuesto (requerido) |
| `states.ternary` | `N` | Tercer estado independiente opcional |
| `initial` | value | Valor inicial |

### Instancia

| Miembro | Descripción |
|--------|-------------|
| `value` | Estado actual |
| `states` | Objeto `{ truly, falsely, ternary }` |
| `toggle()` | Alterna entre opuestos; desde ternary → `truly` |
| `cycle()` | Avanza por todos los estados activos |
| `set(value)` / `reset()` / `is(value)` | Helpers de estado |
| `truly` / `falsely` / `ternary` | Accesores abreviados |

## Ejemplos

### Binario

```html
<div x-data="{ t: $toggle({ states: { truly: 'visible', falsely: 'hidden' } }) }">
  <p x-show="t.is(t.truly)">Shown</p>
  <button type="button" @click="t.toggle()">Toggle</button>
</div>
```

### Ternario

```html
<div x-data="{ t: $toggle({
  states: { truly: 'yes', falsely: 'no', ternary: 'unknown' },
  initial: 'unknown',
}) }">
  <span x-show="t.is(t.truly)">Yes</span>
  <span x-show="t.is(t.falsely)">No</span>
  <span x-show="t.is(t.ternary)">Unknown</span>
  <button type="button" @click="t.toggle()">Yes / No</button>
  <button type="button" @click="t.cycle()">Cycle</button>
</div>
```

## TypeScript

```ts
import { createToggle, type ToggleValue } from "@ailuracode/alpinejs-toggle";

const binary = createToggle({ states: { truly: "on", falsely: "off" } });
binary.ternary; // undefined

const ternary = createToggle({
  states: { truly: "yes", falsely: "no", ternary: "unknown" },
});
type Answer = ToggleValue<"yes", "no", "unknown">;
```

## Ver también

- [Primeros pasos](../getting-started.md)
- [Calendar](./calendar.md) — patrón de magic invocable similar
