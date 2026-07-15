---
title: "Toggle"
description: "Máquinas de estado binárias e ternárias com o magic $toggle."
---

Package: `@ailuracode/alpine-toggle`

Máquina de estados framework-agnostic para Alpine.js. Magic chamável `$toggle()` para máquinas de estado **binárias** e **ternárias** com eventos `change` tipados. Headless — sem DOM, sem CSS, sem armazenamento.

## Instalação

```bash
pnpm add @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Configuração

```ts
import Alpine from "alpinejs";
import { togglePlugin } from "@ailuracode/alpine-toggle";

Alpine.plugin(togglePlugin());
Alpine.start();
```

## API do magic

`$toggle(options)` retorna uma **fachada reativa** apoiada por um `ToggleController` novo a cada chamada. Cada comando é encaminhado ao controller; o plugin inscreve um bridge no evento tipado `change` para que cada transição dispare a armadilha `set` do Alpine e os templates re-renderizem.

### Opções

| Opção                    | Tipo     | Descrição                                                              |
|--------------------------|----------|------------------------------------------------------------------------|
| `states.on`              | `A`      | Primeiro estado oposto (obrigatório)                                   |
| `states.off`             | `B`      | Segundo estado oposto (obrigatório)                                    |
| `states.indeterminate`   | `N`      | Terceiro estado independente opcional                                  |
| `initial`                | valor    | Valor inicial (padrão `on` em binário, `indeterminate` em ternário)    |
| `id`                     | `string` | Identificador estável (gerado automaticamente como `toggle-<n>`)       |

### Fachada retornada por `$toggle(...)`

A fachada estende `ToggleInstance` com flags de lifecycle e a API de hidratação:

| Membro                   | Descrição                                                                  |
|--------------------------|----------------------------------------------------------------------------|
| `value`                  | Estado atual (união estreita — binário omite `undefined`)                  |
| `states`                 | Visão `{ on, off, indeterminate }` (binário: `indeterminate` é `undefined`) |
| `is(value)`              | Se `value` é o estado atual                                                |
| `set(value)`             | Define o estado — no-op se o valor não muda ou é inválido                  |
| `setSilently(value)`     | Define o estado sem emitir `change` (hidratação); a fachada é atualizada   |
| `toggle()`               | Alterna entre `on` e `off`; de `indeterminate` salta para `on`             |
| `next()`                 | Avança por todos os estados na ordem de declaração                        |
| `reset()`                | Restaura `initial`                                                         |
| `id`                     | Identificador estável do controller (gerado automaticamente)                |
| `isMounted`              | `true` após `mount()` ter sido executado                                   |
| `isDestroyed`            | `true` após o controller ter sido destruído                                |

Veja o [README do pacote](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme) para a arquitetura completa e notas sobre o wiring de reatividade.

## Exemplos

### Binário

```html
<div x-data="{ power: $toggle({ states: { on: 'visible', off: 'hidden' } }) }">
  <p x-show="power.is(power.states.on)">Shown</p>
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

### Ternário — quando você precisa de um terceiro estado

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

### Persistir com `setSilently`

Use `setSilently` em `x-init` para hidratar a partir do `localStorage` sem disparar um evento `'user'` espúrio:

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

`detail.source` é um entre `'initialization'` (primeiro emit, `previous: null`), `'user'` (`set` / `toggle` / `next`), ou `'reset'` (`reset()`).

## Controller standalone

O controller também é exposto sem Alpine para testes, widgets TS vanilla ou SSR:

```ts
import { createToggle, ToggleController } from "@ailuracode/alpine-toggle";

const power = createToggle({ states: { on: "on", off: "off" }, id: "power" });
power.id;          // "power"
power.isMounted;   // true (createToggle chama mount() internamente)
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

## Veja também

- [Primeiros passos](../getting-started.md)
- [Theme](./theme.md) — store companheiro com a mesma arquitetura baseada em controllers
