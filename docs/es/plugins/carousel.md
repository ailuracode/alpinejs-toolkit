---
title: "Carousel"
description: "Store headless de carrusel accesible para Alpine.js, impulsado por Embla Carousel."
---

Package: `@ailuracode/alpine-carousel`

Store headless de carrusel accesible para Alpine.js, impulsado por [Embla Carousel](https://www.embla-carousel.com/).

## Instalación

```bash
pnpm add @ailuracode/alpine-carousel alpinejs
```

Dependencias empaquetadas: `embla-carousel` y `embla-carousel-autoplay` se incluyen como dependencias directas.

## Configuración

```ts
import Alpine from "alpinejs";
import carousel from "@ailuracode/alpine-carousel";

Alpine.plugin(carousel());
Alpine.start();
```

## Marcado básico

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

Embla espera el elemento **viewport** (overflow hidden) con un hijo **container** y **slides** como descendientes del container. `viewportProps()` establece `--slide-size: 100%` en el viewport; dimensiona los slides con `flex: 0 0 var(--slide-size)` y `min-width: 0`. Evita `width: 100%` en los slides — se resuelve contra el contenedor flex y desborda en móvil.

## Store API

| Método | Descripción |
|--------|-------------|
| `create(id, options?)` | Registra una instancia de carrusel |
| `bindViewport(id, element)` | Monta Embla en el elemento viewport |
| `destroy(id)` | Destruye Embla y elimina la instancia |
| `next(id)` / `previous(id)` | Navega entre slides |
| `goTo(id, index)` | Salta a un slide |
| `current(id)` / `count(id)` | Índice actual y total de slides |
| `canNext(id)` / `canPrevious(id)` | Disponibilidad de scroll |
| `play(id)` / `pause(id)` / `isPlaying(id)` | Controles de autoplay |
| `handleKeydown(id, event)` | Teclas de flecha, Home, End |
| `carouselProps(id, options?)` | Props ARIA de la región |
| `viewportProps(id, options?)` | Props del viewport enfocable; establece `--slide-size` (predeterminado `100%`, pasa `{ slideSize: false }` para usar clases CSS) |
| `slideProps(id, index)` | Props ARIA por slide |
| `indicatorProps(id, index)` | Props de botón de punto/miniatura |

### Estado reactivo

Cada entrada en `$store.carousel.instances[id]` es un **espejo reactivo** del estado del controller (actualizado en `change` y `slideChange`). Usa comandos del store para mutar; las escrituras directas en `instances[id]` no afectan al controller.

Campos expuestos:

- `currentIndex`, `totalSlides`, `progress`
- `isFirst`, `isLast`, `isPlaying`
- `canNext`, `canPrevious`, `slidesInView`

## Uso standalone (sin Alpine)

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
// o: createCarouselStoreFromController(controller)
```

| Controller API | Descripción |
|----------------|-------------|
| `hasInstance(id)` | Si un id de carrusel está registrado |
| `snapshotInstances()` | Copias superficiales de solo lectura para sincronización del adaptador |
| `current(id)` / `count(id)` / `isPlaying(id)` | Métodos de consulta |

Suscríbete a `controller.on("change", …)` y `controller.on("slideChange", …)` para sincronización del adaptador.

## Arquitectura

`CarouselController` posee todo el estado mutable y las instancias de Embla. El plugin de Alpine refleja instantáneas en `$store.carousel.instances`.

## Migración

| Eliminado / cambiado | Reemplazo |
|----------------------|-----------|
| getter `controller.instances` | `snapshotInstances()` o `hasInstance(id)` |
| `controller.toStore()` | `createCarouselStore()` o `createCarouselStoreFromController(controller)` |
| `$store.carousel.instance(id)` | `goTo(id, index)`, `next(id)`, `previous(id)` y otros métodos semánticos del store |
| `CarouselInstance.embla` / `.autoplay` / `.viewport` en instantáneas | Usa métodos semánticos del store y campos de instantánea de solo lectura |
| `CarouselOptions.align` / `.containScroll` tipados vía Embla | Tipos propios del toolkit `CarouselAlign` y `CarouselContainScroll` |

## Opciones

| Opción | Predeterminado | Mapea a Embla |
|--------|----------------|---------------|
| `loop` | `false` | `loop` |
| `axis` | `'x'` | `axis` |
| `align` | `'start'` | `align` |
| `containScroll` | `'trimSnaps'` | `containScroll` |
| `dragFree` | `false` | `dragFree` |
| `duration` | `25` | `duration` |
| `autoplay` | `false` | `embla-carousel-autoplay` |
| `autoplayOptions.delay` | `4000` | retardo de autoplay |
| `autoplayOptions.stopOnMouseEnter` | `false` | Pausa al hover |
| `autoplayOptions.stopOnInteraction` | `true` (`false` cuando la pausa por hover está activa) | Pausa al arrastrar/clic; debe ser `false` para reanudar al hover |
| `autoplayOptions.stopWhenHidden` | `true` | Pausa cuando el documento está oculto (gestionado por el plugin) |
| `ariaLive` | `'polite'` | `aria-live` en la región del carrusel |
| `onChange` | — | Callback cuando cambia el índice del slide |
