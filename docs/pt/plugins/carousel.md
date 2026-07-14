---
title: "Carousel"
description: "Store headless de carrossel acessível com Embla Carousel e helpers ARIA."
---

Package: `@ailuracode/alpine-carousel`

Store headless de carrossel acessível para Alpine.js, com [Embla Carousel](https://www.embla-carousel.com/).

## Instalação

```bash
pnpm add @ailuracode/alpine-carousel alpinejs
```

Peer dependencies: `embla-carousel` e `embla-carousel-autoplay` são empacotados como dependências diretas.

## Configuração

```ts
import Alpine from "alpinejs";
import carousel from "@ailuracode/alpine-carousel";

Alpine.plugin(carousel());
Alpine.start();
```

## Markup básico

```html
<div
  x-data
  x-init="
    $store.carousel.create('gallery');
    $nextTick(() => $store.carousel.bindViewport('gallery', $refs.viewport))
  "
  @keydown="$store.carousel.handleKeydown('gallery', $event)"
>
  <section x-bind="$store.carousel.carouselProps('gallery', { label: 'Featured gallery' })">
    <div x-ref="viewport" x-bind="$store.carousel.viewportProps('gallery')" class="min-w-0 w-full overflow-hidden">
      <div class="flex touch-pan-y pinch-zoom">
        <div class="min-w-0 shrink-0 grow-0 flex-[0_0_var(--slide-size,100%)]" x-bind="$store.carousel.slideProps('gallery', 0)">Slide 1</div>
        <div class="min-w-0 shrink-0 grow-0 flex-[0_0_var(--slide-size,100%)]" x-bind="$store.carousel.slideProps('gallery', 1)">Slide 2</div>
      </div>
    </div>

    <button type="button" @click="$store.carousel.previous('gallery')">Previous</button>
    <button type="button" @click="$store.carousel.next('gallery')">Next</button>
  </section>
</div>
```

O Embla espera o elemento **viewport** (overflow hidden) com um filho **container** e **slides** como descendentes do container. `viewportProps()` define `--slide-size: 100%` no viewport; dimensione slides com `flex: 0 0 var(--slide-size)` e `min-width: 0`. Evite `width: 100%` nos slides — resolve contra o flex container e transborda no mobile.

## Store API

| Método | Descrição |
|--------|-----------|
| `create(id, options?)` | Registra uma instância de carrossel |
| `bindViewport(id, element)` | Monta Embla no elemento viewport |
| `destroy(id)` | Destrói Embla e remove a instância |
| `next(id)` / `previous(id)` | Navega slides |
| `goTo(id, index)` | Vai para um slide |
| `current(id)` / `count(id)` | Índice atual e total de slides |
| `canNext(id)` / `canPrevious(id)` | Disponibilidade de scroll |
| `play(id)` / `pause(id)` / `isPlaying(id)` | Controles de autoplay |
| `handleKeydown(id, event)` | Teclas Arrow, Home, End |
| `carouselProps(id, options?)` | Props ARIA da região |
| `viewportProps(id, options?)` | Props do viewport focável; define `--slide-size` (padrão `100%`, passe `{ slideSize: false }` para usar classes CSS) |
| `slideProps(id, index)` | Props ARIA por slide |
| `indicatorProps(id, index)` | Props de botão dot/thumbnail |

### Estado reativo

Cada entrada em `$store.carousel.instances[id]` é um **espelho reativo** do estado do controller (atualizado em `change` e `slideChange`). Use comandos da store para mutar; escritas diretas em `instances[id]` não afetam o controller.

Campos expostos:

- `currentIndex`, `totalSlides`, `progress`
- `isFirst`, `isLast`, `isPlaying`
- `canNext`, `canPrevious`, `slidesInView`

## Uso standalone (sem Alpine)

```ts
import {
  createCarouselController,
  createCarouselStore,
  createCarouselStoreFromController,
} from "@ailuracode/alpine-carousel";

const controller = createCarouselController();
controller.create("gallery", { loop: true });
controller.current("gallery"); // 0

const store = createCarouselStore();
// ou: createCarouselStoreFromController(controller)
```

| API do controller | Descrição |
|-------------------|-------------|
| `hasInstance(id)` | Se um id de carrossel está registrado |
| `snapshotInstances()` | Cópias readonly rasas para sincronização com adapter |
| `current(id)` / `count(id)` / `isPlaying(id)` | Métodos de consulta |

Inscreva-se em `controller.on("change", …)` e `controller.on("slideChange", …)` para sincronização com adapter.

## Arquitetura

`CarouselController` possui todo o estado mutável e as instâncias Embla. O plugin Alpine espelha snapshots em `$store.carousel.instances`.

## Migração

| Removido / alterado | Substituição |
|---------------------|--------------|
| getter `controller.instances` | `snapshotInstances()` ou `hasInstance(id)` |
| `controller.toStore()` | `createCarouselStore()` ou `createCarouselStoreFromController(controller)` |
| `$store.carousel.instance(id)` | `goTo(id, index)`, `next(id)`, `previous(id)` e outros métodos semânticos da store |
| `CarouselInstance.embla` / `.autoplay` / `.viewport` em snapshots | Use métodos semânticos da store e campos readonly do snapshot |
| `CarouselOptions.align` / `.containScroll` tipados via Embla | Tipos próprios do toolkit `CarouselAlign` e `CarouselContainScroll` |

## Opções

| Opção | Padrão | Mapeia para Embla |
|--------|---------|-------------------|
| `loop` | `false` | `loop` |
| `axis` | `'x'` | `axis` |
| `align` | `'start'` | `align` |
| `containScroll` | `'trimSnaps'` | `containScroll` |
| `dragFree` | `false` | `dragFree` |
| `duration` | `25` | `duration` |
| `autoplay` | `false` | `embla-carousel-autoplay` |
| `autoplayOptions.delay` | `4000` | delay do autoplay |
| `autoplayOptions.stopOnMouseEnter` | `false` | Pausa no hover |
| `autoplayOptions.stopOnInteraction` | `true` (`false` quando pausa no hover está ativa) | Pausa no drag/click; deve ser `false` para retomar no hover |
| `autoplayOptions.stopWhenHidden` | `true` | Pausa quando o documento está oculto (gerenciado pelo plugin) |
| `ariaLive` | `'polite'` | `aria-live` na região do carrossel |
| `onChange` | — | Callback quando o índice do slide muda |
