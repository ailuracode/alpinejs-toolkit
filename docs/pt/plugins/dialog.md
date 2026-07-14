---
title: "Dialog"
description: "Store headless de diálogos acessíveis com focus trap, scroll lock e helpers ARIA via $store.dialog."
---

Package: `@ailuracode/alpine-dialog`

Store headless de diálogos acessíveis para Alpine.js — estado open/close, focus trap, integração com bloqueio de scroll e helpers ARIA. Sem markup ou CSS incluídos.

## Instalação

```bash
pnpm add @ailuracode/alpine-dialog alpinejs
```

## Configuração

```ts
import Alpine from "alpinejs";
import { dialogPlugin } from "@ailuracode/alpine-dialog";
import { scrollPlugin } from "@ailuracode/alpine-scroll";

Alpine.plugin(scrollPlugin());
Alpine.plugin(
  dialogPlugin({
    scroll: Alpine.store("scroll"),
  })
);
Alpine.start();
```

## Store API

```ts
// Open / close / toggle
$store.dialog.open("settings");
$store.dialog.close("settings");
$store.dialog.toggle("settings");
$store.dialog.isOpen("settings");

// Register / unregister instances
$store.dialog.register("confirm", { closeOnEscape: true, scrollLock: true });
$store.dialog.unregister("confirm");

// Accessibility helpers
$store.dialog.bindContainer("settings", containerEl);
$store.dialog.handleKeydown("settings", event);
$store.dialog.handleOutsideClick("settings", event);
$store.dialog.dialogProps("settings");
// → { role: "dialog", "aria-modal": true, "aria-labelledby": ..., "aria-describedby": ... }

// Cleanup
$store.dialog.destroy();
```

## Opções

```ts
dialogPlugin({
  id?: string,                    // identificador do controller
  closeOnEscape?: boolean,        // padrão: true
  closeOnOutsideClick?: boolean,  // padrão: true
  scrollLock?: boolean,           // padrão: true
  scroll?: ScrollStore,           // store opcional de @ailuracode/alpine-scroll
});
```

## Uso standalone (sem Alpine)

```ts
import { createDialogController } from "@ailuracode/alpine-dialog";

const controller = createDialogController({ scrollLock: true });
controller.register("my-dialog");
controller.open("my-dialog");
controller.isOpen("my-dialog"); // true
controller.close("my-dialog");
controller.destroy();
```

Use `createDialogStore()` para um objeto com forma de store sem Alpine, ou `createDialogStoreFromController(controller)` ao conectar um adaptador personalizado.

| Controller API | Descrição |
|----------------|-------------|
| `hasInstance(id)` | Se um id de diálogo está registrado |
| `snapshotInstances()` | Cópias somente leitura rasas para sync do adaptador |
| `isOpen(id)` | Consulta estado aberto |

O controller emite eventos `open`, `close` e `change`. O plugin Alpine espelha snapshots em `$store.dialog.instances`.

## Arquitetura

`DialogController` possui todo o estado mutável. `$store.dialog.instances` é um espelho reativo atualizado em `open`, `close` e `change`. Mutar snapshots da store diretamente não altera o estado do controller.

## Migração

| Removido / alterado | Substituição |
|-------------------|-------------|
| getter `controller.instances` | `snapshotInstances()` ou `hasInstance(id)` |
| `controller.toStore()` | `createDialogStore()` ou `createDialogStoreFromController(controller)` |

## Markup básico

```html
<div
  x-data
  x-init="$store.dialog.register('settings')"
  @keydown.window="$store.dialog.handleKeydown('settings', $event)"
>
  <button @click="$store.dialog.open('settings', { trigger: $event.target })">
    Settings
  </button>

  <template x-teleport="body">
    <div
      x-show="$store.dialog.isOpen('settings')"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        x-bind="$store.dialog.dialogProps('settings')"
        x-init="$store.dialog.bindContainer('settings', $el)"
        @click.stop
      >
    <h2 id="settings-title">Settings</h2>
    <p id="settings-desc">Update your preferences.</p>
    <button @click="$store.dialog.close('settings')">Close</button>
    </div>
  </div>
  </template>
</div>
```

## Acessibilidade

- `role="dialog"` e `aria-modal="true"` via `dialogProps()`
- Focus trap ativa quando o container é vinculado e o diálogo abre
- Foco restaura para o elemento trigger ao fechar
- Escape dispensa quando habilitado

## SSR

Estado é em memória. Proteja bindings DOM (`bindContainer`, focus trap) atrás de `x-init` ou wrappers somente no cliente.

## Integração

- **Scroll** — passe `$store.scroll` como `scroll` (veja [`scroll`](./scroll.md))
- **Toast** — exiba toasts de confirmação após ações do diálogo na sua camada de UI (não é dependência obrigatória; veja [`toast`](./toast.md))

## Limitações

- Empilhamento/z-index é responsabilidade do consumidor — envolva modais em `<template x-teleport="body">` quando dentro de ancestrais `overflow-hidden` (`x-teleport` exige tag `<template>` no Alpine 3)
- Um focus trap por id de diálogo; vincule o elemento raiz do painel do diálogo
