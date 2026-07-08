---
title: "Toggle"
description: "Alternar estados binarios y ternarios con el magic $toggle."
---

Package: `@ailuracode/alpine-toggle`

Máquina de estados framework-agnostic para Alpine.js. Magic invocable `$toggle()` para máquinas de estado **binarias** y **ternarias** con eventos `change` tipados.

## Instalación

```bash
pnpm add @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Configuración

```ts
import Alpine from "alpinejs";
import { togglePlugin } from "@ailuracode/alpine-toggle";

Alpine.plugin(togglePlugin());
Alpine.start();
```

## API del magic

`$toggle(options)` devuelve un `ToggleController` reactivo por llamada. Cada comando se reenvía al controller — consulta el [README del paquete](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme) para la arquitectura completa.

### Opciones

| Opción                  | Tipo     | Descripción                                                              |
|-------------------------|----------|--------------------------------------------------------------------------|
| `states.on`             | `A`      | Primer estado opuesto (requerido)                                        |
| `states.off`            | `B`      | Segundo estado opuesto (requerido)                                       |
| `states.indeterminate`  | `N`      | Tercer estado independiente opcional                                     |
| `initial`               | valor    | Valor inicial (por defecto `on` en binario, `indeterminate` en ternario) |

### Instancia

| Miembro                  | Descripción                                                                  |
|--------------------------|------------------------------------------------------------------------------|
| `value`                  | Estado actual                                                                |
| `states`                 | Vista `{ on, off, indeterminate }`                                           |
| `is(value)`              | Si `value` es el estado actual                                               |
| `set(value)`             | Establece el estado — no-op si el valor no cambia o es inválido             |
| `setSilently(value)`     | Establece el estado sin emitir `change` (para hidratación)                   |
| `toggle()`               | Alterna entre `on` y `off`; desde `indeterminate` salta a `on`               |
| `next()`                 | Avanza por todos los estados en orden de declaración                         |
| `reset()`                | Restaura `initial`                                                          |
| `on('change', listener)` | Se suscribe a las transiciones; detail = `{ current, previous, source }`     |
| `destroy()`              | Idempotente — libera todos los listeners                                     |

## Ejemplos

### Binario

```html
<div x-data="{ power: $toggle({ states: { on: 'visible', off: 'hidden' } }) }">
  <p x-show="power.is(power.states.on)">Shown</p>
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

### Ternario — cuando necesitás un tercer estado

```html
<div x-data="{ answer: $toggle({
  states: { on: 'yes', off: 'no', indeterminate: 'unknown' },
  initial: 'unknown',
}) }">
  <span x-show="answer.is(answer.states.on)">Yes</span>
  <span x-show="answer.is(answer.states.off)">No</span>
  <span x-show="answer.is(answer.states.indeterminate)">Unknown</span>
  <button type="button" @click="answer.toggle()">Yes / No</button>
  <button type="button" @click="answer.next()">Cycle</button>
</div>
```

### Eventos `change`

```ts
import { createToggle, type ToggleChangeDetail } from "@ailuracode/alpine-toggle";

const answer = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

answer.on("change", (detail: ToggleChangeDetail<"yes", "no", "unknown">) => {
  console.log(detail.current, detail.previous, detail.source);
});
```

## TypeScript

```ts
import { createToggle, type ToggleInstance } from "@ailuracode/alpine-toggle";

const binary = createToggle({ states: { on: "on", off: "off" } });
binary.states.indeterminate; // undefined

const ternary = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

const instance: ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown"> = ternary;
```

## Ver también

- [Primeros pasos](../getting-started.md)
- [Theme](./theme.md) — store compañero con la misma arquitectura basada en controllers