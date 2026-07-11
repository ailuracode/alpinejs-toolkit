---
title: "Carousel"
description: "Package: @ailuracode/alpine-carousel"
---

Package: `@ailuracode/alpine-carousel`

Headless accessible carousel store for Alpine.js. Uses [Embla Carousel](https://www.embla-carousel.com/) and [embla-carousel-autoplay](https://www.embla-carousel.com/plugins/autoplay/) internally. Manages initialization, reactive state, keyboard navigation, autoplay, and WAI-ARIA helpers. **No HTML or CSS is shipped.**

## Install

```bash
npm install @ailuracode/alpine-carousel alpinejs
```

Dependencies `embla-carousel` and `embla-carousel-autoplay` are included with the package.

## Setup

```js
import Alpine from "alpinejs";
import carousel from "@ailuracode/alpine-carousel";

Alpine.plugin(carousel());
Alpine.start();
```

## Store API

| Method | Description |
|--------|-------------|
| `create(id, options?)` | Register a carousel instance |
| `bindViewport(id, element)` | Mount Embla on the viewport element |
| `destroy(id)` | Destroy Embla and remove the instance |
| `next(id)` / `previous(id)` | Navigate slides |
| `goTo(id, index)` | Jump to a slide |
| `current(id)` / `count(id)` | Current index and total slides |
| `canNext(id)` / `canPrevious(id)` | Scroll availability |
| `play(id)` / `pause(id)` / `isPlaying(id)` | Autoplay controls |
| `instance(id)` | Raw Embla API for advanced use |
| `handleKeydown(id, event)` | Arrow keys, Home, End |
| `carouselProps(id, options?)` | ARIA region props |
| `viewportProps(id)` | Focusable viewport props |
| `slideProps(id, index)` | Per-slide ARIA props |
| `indicatorProps(id, index)` | Dot/thumbnail button props |

### Reactive state

Bind templates to `$store.carousel.instances[id]`. Each entry is a **reactive mirror** of controller state (updated on `change` and `slideChange`). Use store commands to mutate; direct writes to `instances[id]` do not affect the controller.

| Property | Description |
|----------|-------------|
| `currentIndex` | Selected slide index |
| `totalSlides` | Number of scroll snaps |
| `progress` | Scroll progress (0–1) |
| `isFirst` / `isLast` | Position in the snap list |
| `isPlaying` | Autoplay active |
| `canNext` / `canPrevious` | Whether Embla can scroll |
| `slidesInView` | Indices of slides in view |

Convenience accessors mirror the reactive fields: `current(id)`, `count(id)`, etc.

## Architecture

`CarouselController` owns all mutable state and Embla instances. The Alpine plugin mirrors snapshots into `$store.carousel.instances`.

## Standalone usage (no Alpine)

```ts
import {
  createCarouselController,
  createCarouselStore,
  createCarouselStoreFromController,
} from "@ailuracode/alpine-carousel";

const controller = createCarouselController();
controller.create("gallery", { loop: true });
controller.bindViewport("gallery", viewportEl);

const store = createCarouselStore();
// or: createCarouselStoreFromController(controller)
```

| Controller API | Description |
|----------------|-------------|
| `hasInstance(id)` | Whether a carousel id is registered |
| `snapshotInstances()` | Shallow readonly copies for adapter sync |
| `current(id)` / `count(id)` / `isPlaying(id)` | Query methods |

Subscribe to `controller.on("change", …)` and `controller.on("slideChange", …)` for adapter sync.

## Migration

| Removed / changed | Replacement |
|-------------------|-------------|
| `controller.instances` getter | `snapshotInstances()` or `hasInstance(id)` |
| `controller.toStore()` | `createCarouselStore()` or `createCarouselStoreFromController(controller)` |

## Configuration

```js
$store.carousel.create("gallery", {
  loop: true,
  autoplay: true,
  autoplayOptions: {
    delay: 5000,
    stopOnInteraction: true,
    stopOnMouseEnter: false,
    stopWhenHidden: true,
  },
  axis: "x",
  align: "start",
  containScroll: "trimSnaps",
  dragFree: false,
  duration: 25,
  ariaLive: "polite",
  onChange(index) {
    console.log("Slide", index);
  },
});
```

These options map directly to Embla Carousel and the autoplay plugin where applicable.

## Markup structure

Embla expects a **viewport** (overflow hidden) with a **container** child and **slides** inside the container.

Each slide must not shrink inside the flex row. Embla measures computed slide sizes — set `--slide-size: 100%` on the **viewport** (via `viewportProps()`, which applies it by default) and size slides with `flex: 0 0 var(--slide-size)` plus `min-width: 0`. Do **not** use `width: 100%` or `flex-basis: 100%` alone; those resolve against the flex container (wider than the viewport) and slides overflow on mobile.

Tailwind example — viewport from `viewportProps()`, slides:

```html
<div x-bind="$store.carousel.viewportProps('gallery')" class="min-w-0 w-full overflow-hidden">
  <div class="flex touch-pan-y pinch-zoom">
    <div class="min-w-0 shrink-0 grow-0 [flex:0_0_var(--slide-size,100%)]">…</div>
  </div>
</div>
```

Parent grids/flex layouts also need `min-w-0` so the carousel can shrink below its content width.

```html
<div
  x-data
  x-init="
    $store.carousel.create('gallery', { loop: true });
    $nextTick(() => $store.carousel.bindViewport('gallery', $refs.viewport))
  "
  @keydown="$store.carousel.handleKeydown('gallery', $event)"
>
  <section x-bind="$store.carousel.carouselProps('gallery', { label: 'Product gallery' })">
    <div x-ref="viewport" x-bind="$store.carousel.viewportProps('gallery')" class="min-w-0 w-full overflow-hidden">
      <div class="flex touch-pan-y pinch-zoom">
        <template x-for="(item, index) in items" :key="item.id">
          <div
            class="min-w-0 shrink-0 grow-0 [flex:0_0_var(--slide-size,100%)]"
            x-bind="$store.carousel.slideProps('gallery', index)"
          >
            <!-- slide content -->
          </div>
        </template>
      </div>
    </div>

    <div role="tablist" aria-label="Choose slide">
      <template x-for="(_, index) in Array.from({ length: $store.carousel.count('gallery') })" :key="index">
        <button
          x-bind="$store.carousel.indicatorProps('gallery', index)"
          @click="$store.carousel.goTo('gallery', index)"
        ></button>
      </template>
    </div>
  </section>
</div>
```

## Autoplay

Enable with `autoplay: true`. Use `play(id)` and `pause(id)` for programmatic control. By default autoplay pauses on user interaction and when the document is hidden.

For hover pause (`stopOnMouseEnter: true`), the store sets `stopOnInteraction` to `false` unless you override it — Embla only resumes autoplay on `mouseleave` when interaction does not permanently stop playback.

## Accessibility

- `carouselProps()` sets `role="region"`, `aria-roledescription="carousel"`, and configurable `aria-live`
- `slideProps()` sets `role="group"`, `aria-roledescription="slide"`, and `aria-hidden` on inactive slides
- `indicatorProps()` sets accessible labels for dot/thumbnail controls
- `handleKeydown()` supports Arrow keys, Home, and End
- `viewportProps()` adds `tabindex="0"` for keyboard focus

## Advanced API

Access the underlying Embla instance for custom plugins or APIs:

```js
const embla = $store.carousel.instance("gallery");
embla?.scrollTo(2, true);
```

Prefer the store API for stable behavior across releases.

## Playground

See live examples at `/playground/carousel/` in the demo app.
