---
title: "Toggle"
description: "Alternar estados binarios y ternarios con el magic $toggle."
---

Package: `@ailuracode/alpine-toggle`

Máquina de estados framework-agnostic para Alpine.js. Magic invocable `$toggle()` para máquinas de estado **binarias** y **ternarias** con eventos `change` tipados.

## Niveles de capacidad

El paquete expone tres entrypoints. Todas las variantes registran el mismo magic `$toggle` — solo cambia el plugin importado.

| Variante | Import | Uso recomendado |
| -------- | ------ | --------------- |
| **Puppy** | `@ailuracode/alpine-toggle/puppy` | Booleano `true` / `false` |
| **Doggo** | `@ailuracode/alpine-toggle/doggo` | Estados personalizados y `onChange()` |
| **Big Dog** | `@ailuracode/alpine-toggle` | Ciclo de vida completo, hidratación y eventos tipados |

Cada entrypoint exporta los mismos nombres públicos (`createToggle`, `togglePlugin`, `ToggleController`, …). Elige la ruta de import según el nivel; usa alias si cargas más de una variante en el mismo archivo.

```ts
import { createToggle as createPuppyToggle, togglePlugin as puppyTogglePlugin } from "@ailuracode/alpine-toggle/puppy";
import { createToggle as createDoggoToggle, togglePlugin as doggoTogglePlugin } from "@ailuracode/alpine-toggle/doggo";
import { createToggle, togglePlugin } from "@ailuracode/alpine-toggle";
```

Consulta el [README del paquete](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#capability-tiers) para la guía completa de selección y tamaños de bundle.

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

Para Puppy o Doggo, importa el plugin desde el subpath correspondiente en lugar del entrypoint raíz.

## API del magic

`$toggle(options)` devuelve un controller reactivo por llamada en **Big Dog** y **Doggo**. En **Puppy**, `$toggle(initial?)` acepta un booleano opcional.

### Opciones (Doggo y Big Dog)

| Opción                  | Tipo     | Descripción                                                              |
|-------------------------|----------|--------------------------------------------------------------------------|
| `states.on`             | `A`      | Primer estado opuesto (requerido)                                        |
| `states.off`            | `B`      | Segundo estado opuesto (requerido)                                       |
| `states.indeterminate`  | `N`      | Tercer estado independiente opcional                                     |
| `initial`               | valor    | Valor inicial (por defecto `on` en binario, `indeterminate` en ternario) |

### Instancia Big Dog

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

Doggo expone `onChange()` en lugar del bus de eventos tipado. Puppy solo incluye `value`, `set()` y `toggle()`.

## Ejemplos

### Puppy — booleano

```html
<div x-data="{ lamp: $toggle(false) }">
  <p x-text="lamp.value"></p>
  <button type="button" @click="lamp.toggle()">Toggle</button>
</div>
```

### Binario (Doggo / Big Dog)

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

### Eventos `change` (Big Dog)

```ts
import { createToggle, type ToggleChangeDetail } from "@ailuracode/alpine-toggle";

const answer = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

answer.on("change", (detail: ToggleChangeDetail<"yes", "no", "unknown">) => {
  console.log(detail.current, detail.previous, detail.source);
});
```

### Suscripciones ligeras (Doggo)

```ts
import { createToggle } from "@ailuracode/alpine-toggle/doggo";

const filter = createToggle({
  states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
});

filter.onChange(({ current, previous }) => {
  console.log(previous, current);
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
