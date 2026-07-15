---
title: "Toggle"
description: "Alternar estados binarios y ternarios con el magic $toggle."
---

Package: `@ailuracode/alpine-toggle`

Máquina de estados framework-agnostic para Alpine.js. Magic chamável `$toggle()` para máquinas de estado **binárias** e **ternárias** com eventos `change` tipados.

## Níveis de capacidade

O pacote expõe três entrypoints. Todas as variantes registram o mesmo magic `$toggle` — apenas o plugin importado muda.

| Variante | Import | Uso recomendado |
| -------- | ------ | --------------- |
| **Puppy** | `@ailuracode/alpine-toggle/puppy` | Booleano `true` / `false` |
| **Doggo** | `@ailuracode/alpine-toggle/doggo` | Estados personalizados e `onChange()` |
| **Big Dog** | `@ailuracode/alpine-toggle` | Ciclo de vida completo, hidratação e eventos tipados |

```ts
import puppyTogglePlugin from "@ailuracode/alpine-toggle/puppy";
import doggoTogglePlugin from "@ailuracode/alpine-toggle/doggo";
import { togglePlugin } from "@ailuracode/alpine-toggle";
```

Consulte o [README do pacote](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#capability-tiers) para o guia completo de seleção e tamanhos de bundle.

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

Para Puppy ou Doggo, importe o plugin do subpath correspondente em vez do entrypoint raiz.

## API do magic

`$toggle(options)` retorna um controller reativo por chamada em **Big Dog** e **Doggo**. Em **Puppy**, `$toggle(initial?)` aceita um booleano opcional.

### Opções (Doggo e Big Dog)

| Opção                    | Tipo     | Descrição                                                              |
|--------------------------|----------|------------------------------------------------------------------------|
| `states.on`              | `A`      | Primeiro estado oposto (obrigatório)                                   |
| `states.off`             | `B`      | Segundo estado oposto (obrigatório)                                    |
| `states.indeterminate`   | `N`      | Terceiro estado independente opcional                                  |
| `initial`                | valor    | Valor inicial (padrão `on` em binário, `indeterminate` em ternário)    |

### Instância Big Dog

| Membro                   | Descrição                                                                  |
|--------------------------|----------------------------------------------------------------------------|
| `value`                  | Estado atual                                                               |
| `states`                 | Visão `{ on, off, indeterminate }`                                         |
| `is(value)`              | Se `value` é o estado atual                                                |
| `set(value)`             | Define o estado — no-op se o valor não muda ou é inválido                  |
| `setSilently(value)`     | Define o estado sem emitir `change` (para hidratação)                     |
| `toggle()`               | Alterna entre `on` e `off`; de `indeterminate` salta para `on`             |
| `next()`                 | Avança por todos os estados na ordem de declaração                        |
| `reset()`                | Restaura `initial`                                                         |
| `on('change', listener)` | Inscreve-se nas transições; detail = `{ current, previous, source }`      |
| `destroy()`              | Idempotente — libera todos os listeners                                    |

Doggo expõe `onChange()` em vez do barramento de eventos tipado. Puppy inclui apenas `value`, `set()` e `toggle()`.

## Exemplos

### Puppy — booleano

```html
<div x-data="{ lamp: $toggle(false) }">
  <p x-text="lamp.value"></p>
  <button type="button" @click="lamp.toggle()">Toggle</button>
</div>
```

### Binário (Doggo / Big Dog)

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

### Subscrições leves (Doggo)

```ts
import { createDoggoToggle } from "@ailuracode/alpine-toggle/doggo";

const filter = createDoggoToggle({
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

## Veja também

- [Primeiros passos](../getting-started.md)
- [Theme](./theme.md) — store companheiro com a mesma arquitetura baseada em controllers
