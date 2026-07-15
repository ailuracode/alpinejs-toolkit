---
title: "Toggle"
description: "Máquinas de estado binarias y ternarias con el magic $toggle."
---

Package: `@ailuracode/alpine-toggle`

Máquina de estados framework-agnostic para Alpine.js. Magic invocable `$toggle()` para máquinas de estado **binarias** y **ternarias** con eventos `change` tipados. Headless: sin DOM, sin CSS, sin almacenamiento.

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

`$toggle(options)` devuelve una **fachada reactiva** respaldada por un `ToggleController` fresco por llamada. Cada comando se reenvía al controller; el plugin suscribe un bridge al evento tipado `change` para que cada transición dispare la trampa `set` de Alpine y los templates vuelvan a renderizar.

### Opciones

| Opción                  | Tipo     | Descripción                                                              |
|-------------------------|----------|--------------------------------------------------------------------------|
| `states.on`             | `A`      | Primer estado opuesto (requerido)                                        |
| `states.off`            | `B`      | Segundo estado opuesto (requerido)                                       |
| `states.indeterminate`  | `N`      | Tercer estado independiente opcional                                     |
| `initial`               | valor    | Valor inicial (por defecto `on` en binario, `indeterminate` en ternario) |
| `id`                    | `string` | Identificador estable (auto-generado como `toggle-<n>`)                  |

### Fachada devuelta por `$toggle(...)`

La fachada extiende `ToggleInstance` con banderas de lifecycle y la API de hidratación:

| Miembro                  | Descripción                                                                  |
|--------------------------|------------------------------------------------------------------------------|
| `value`                  | Estado actual (unión estrecha — binario omite `undefined`)                    |
| `states`                 | Vista `{ on, off, indeterminate }` (binario: `indeterminate` es `undefined`) |
| `is(value)`              | Si `value` es el estado actual                                               |
| `set(value)`             | Establece el estado — no-op si el valor no cambia o es inválido             |
| `setSilently(value)`     | Establece el estado sin emitir `change` (hidratación); la fachada se actualiza |
| `toggle()`               | Alterna entre `on` y `off`; desde `indeterminate` salta a `on`               |
| `next()`                 | Avanza por todos los estados en orden de declaración                         |
| `reset()`                | Restaura `initial`                                                          |
| `id`                     | Identificador estable del controller (auto-generado)                         |
| `isMounted`              | `true` después de que `mount()` se haya ejecutado                            |
| `isDestroyed`            | `true` después de que el controller fue destruido                            |

Consulta el [README del paquete](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme) para la arquitectura completa y notas sobre el wiring de reactividad.

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

### Persistir con `setSilently`

Usá `setSilently` desde `x-init` para hidratar desde `localStorage` sin disparar un evento `'user'` espurio:

```html
<div
  x-data="{
    mode: $toggle({ states: { on: 'on', off: 'off' } }),
    init() {
      const persisted = localStorage.getItem('mode');
      if (persisted) this.mode.setSilently(persisted);
    },
  }"
>
  <span x-text="mode.value"></span>
  <button
    type="button"
    @click="mode.toggle(); localStorage.setItem('mode', mode.value)"
  >
    Toggle
  </button>
</div>
```

## Eventos `change`

```ts
import { createToggle, type ToggleChangeDetail } from "@ailuracode/alpine-toggle";

const answer = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

answer.on("change", (detail: ToggleChangeDetail<"yes", "no", "unknown">) => {
  console.log(detail.current, detail.previous, detail.source);
});
```

`detail.source` es uno de `'initialization'` (primer emit, `previous: null`), `'user'` (`set` / `toggle` / `next`), o `'reset'` (`reset()`).

## Controller standalone

El controller también se expone sin Alpine para tests, widgets TS vanilla o SSR:

```ts
import { createToggle, ToggleController } from "@ailuracode/alpine-toggle";

const power = createToggle({ states: { on: "on", off: "off" }, id: "power" });
power.id;          // "power"
power.isMounted;   // true (createToggle invoca mount() internamente)
power.on("change", (detail) => console.log(detail));
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
